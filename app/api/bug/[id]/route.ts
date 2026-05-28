import { runCoralQuery, getTimelineForBug } from "@/lib/coralQuery";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const results = runCoralQuery();
  const bug = results.find((r) => r.id === id);

  if (!bug) {
    return Response.json({ error: "Bug not found" }, { status: 404 });
  }

  const timeline = getTimelineForBug(id);

  return Response.json({ bug, timeline });
}
