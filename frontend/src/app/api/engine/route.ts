import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "Send a valid JSON request." },
      { status: 400 },
    );
  }
  if (!["solve", "optimize", "cohort", "benchmark"].includes(payload?.action))
    return Response.json(
      { error: "Unknown analysis action." },
      { status: 400 },
    );
  if (JSON.stringify(payload).length > 4096)
    return Response.json({ error: "Request is too large." }, { status: 413 });
  const root = path.resolve(process.cwd(), "../backend");
  const local = path.join(
    root,
    ".venv",
    process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
  );
  const python =
    process.env.TRAB_PYTHON || (existsSync(local) ? local : "python");
  try {
    const result = await new Promise<unknown>((resolve, reject) => {
      const child = spawn(python, [path.join(root, "engine.py")], {
        cwd: root,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "",
        stderr = "",
        settled = false;
      const timeout = setTimeout(() => {
        child.kill();
        reject(
          new Error(
            "Analysis timed out. Reduce the search size and try again.",
          ),
        );
      }, 45000);
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", () => {
        clearTimeout(timeout);
        settled = true;
        reject(
          new Error(
            "Python engine is unavailable. Install backend requirements or set TRAB_PYTHON.",
          ),
        );
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (settled) return;
        settled = true;
        try {
          const data = JSON.parse(stdout);
          if (code !== 0 || data.error)
            reject(new Error(data.error || "The solver failed."));
          else resolve(data);
        } catch {
          reject(
            new Error(
              stderr
                ? "The analysis engine failed. Check the server log."
                : "The engine returned an invalid response.",
            ),
          );
        }
      });
      child.stdin.on("error", () => {});
      child.stdin.end(JSON.stringify(payload));
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Analysis failed." },
      { status: 422 },
    );
  }
}
