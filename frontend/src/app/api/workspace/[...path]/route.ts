import { workspaceRequest } from "@/lib/workspace-server";
export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  return workspaceRequest(request, (await context.params).path);
}
export { handle as GET, handle as POST, handle as PUT };
