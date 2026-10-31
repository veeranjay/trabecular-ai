import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
} from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "../backend");
const base = process.env.TRAB_API_URL || "http://127.0.0.1:8100";
const state = globalThis as typeof globalThis & {
  trabServiceBoot?: Promise<void>;
  trabServiceReady?: boolean;
};

async function healthy() {
  try {
    const response = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(1000),
      cache: "no-store",
    });
    const body = await response.json();
    return response.ok && body.service === "trab-workspace";
  } catch {
    return false;
  }
}

async function boot() {
  if (await healthy()) return;
  const restartMarker = path.join(root, "data", ".service_restart.json");
  try {
    const restart = JSON.parse(readFileSync(restartMarker, "utf8"));
    if (Date.now() - Number(restart.started_at_ms) < 30000) {
      for (let attempt = 0; attempt < 60; attempt++) {
        if (await healthy()) return;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      throw new Error("The analysis service is restarting. Retry in a moment.");
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("The analysis service is restarting")
    )
      throw error;
  }
  const url = new URL(base);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("The configured analysis service is unavailable.");
  const local = path.join(
    root,
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const python = process.env.TRAB_PYTHON || local;
  if (!existsSync(/* turbopackIgnore: true */ python))
    throw new Error(
      "Install the backend virtual environment before opening this workspace.",
    );
  mkdirSync(path.join(root, "data"), { recursive: true });
  const log = openSync(path.join(root, "data", "service.log"), "a");
  const child = spawn(
    /* turbopackIgnore: true */ python,
    [path.join(root, "service.py")],
    {
      cwd: root,
      windowsHide: true,
      stdio: ["ignore", log, log],
    },
  );
  child.on("error", () => {
    state.trabServiceBoot = undefined;
  });
  child.unref();
  closeSync(log);
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await healthy()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    "The workspace service could not start. Check backend/data/service.log.",
  );
}

export async function workspaceRequest(request: Request, segments: string[]) {
  if (segments.some((part) => !/^[a-zA-Z0-9_.-]+$/.test(part)))
    return Response.json(
      { detail: "Invalid workspace path." },
      { status: 400 },
    );
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  // Next may normalize the request URL to localhost even for a numeric host.
  // Compare against the actual Host header, never a forwarded host supplied by a client.
  const publicUrl = new URL(requestUrl.origin);
  publicUrl.host = request.headers.get("host") || requestUrl.host;
  if (request.method !== "GET" && origin && origin !== publicUrl.origin)
    return Response.json(
      { detail: "Open this action from your workspace." },
      { status: 403 },
    );
  try {
    if (
      state.trabServiceBoot &&
      state.trabServiceReady !== false &&
      !(await healthy())
    ) {
      state.trabServiceBoot = undefined;
      state.trabServiceReady = false;
    }
    if (!state.trabServiceBoot) {
      state.trabServiceReady = false;
      state.trabServiceBoot = boot()
        .then(() => {
          state.trabServiceReady = true;
        })
        .catch((error) => {
          state.trabServiceBoot = undefined;
          throw error;
        });
    }
    await state.trabServiceBoot;
    const key =
      process.env.TRAB_BRIDGE_KEY ||
      readFileSync(path.join(root, "data", ".service_key"), "utf8").trim();
    const headers = new Headers({
      "X-Trab-Bridge": key,
      "X-Trab-Public-Host": publicUrl.hostname,
    });
    const authorization = request.headers.get("authorization");
    if (authorization) headers.set("Authorization", authorization);
    let body: string | ArrayBuffer | undefined;
    if (!["GET", "HEAD"].includes(request.method)) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.startsWith("multipart/form-data")) {
        const limit = 21 * 1024 * 1024;
        const reader = request.body?.getReader();
        const chunks: Uint8Array[] = [];
        let length = 0;
        if (Number(request.headers.get("content-length")) > limit)
          return Response.json(
            { detail: "Imports are limited to 20 MB." },
            { status: 413 },
          );
        if (reader)
          for (;;) {
            const next = await reader.read();
            if (next.done) break;
            length += next.value.length;
            if (length > limit) {
              await reader.cancel();
              return Response.json(
                { detail: "Imports are limited to 20 MB." },
                { status: 413 },
              );
            }
            chunks.push(next.value);
          }
        const bytes = new Uint8Array(length);
        let offset = 0;
        for (const chunk of chunks) {
          bytes.set(chunk, offset);
          offset += chunk.length;
        }
        body = bytes.buffer;
        headers.set("Content-Type", contentType);
      } else {
        body = await request.text();
        if (body.length > 65536)
          return Response.json(
            { detail: "Request is too large." },
            { status: 413 },
          );
        headers.set("Content-Type", "application/json");
      }
    }
    const response = await fetch(
      `${base}/${segments.join("/")}${requestUrl.search}`,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(60000),
      },
    );
    const outputHeaders = new Headers({
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    const disposition = response.headers.get("content-disposition");
    if (disposition) outputHeaders.set("Content-Disposition", disposition);
    return new Response(response.body, {
      status: response.status,
      headers: outputHeaders,
    });
  } catch (error) {
    state.trabServiceBoot = undefined;
    state.trabServiceReady = false;
    return Response.json(
      {
        detail:
          error instanceof Error ? error.message : "Workspace unavailable.",
      },
      { status: 503 },
    );
  }
}
