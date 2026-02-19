import { listDrawings } from "@/data/drawings";
import { DrawingsPageContent } from "@/components/drawings/drawings-page-content";

export default async function DrawingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const drawings = await listDrawings(id);

  return <DrawingsPageContent projectId={id} initialDrawings={drawings} />;
}
