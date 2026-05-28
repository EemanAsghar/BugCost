import { runCoralQuery } from "@/lib/coralQuery";

export async function GET() {
  try {
    const results = runCoralQuery();
    return Response.json({ results, query_source: "coral_demo_mode" });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
