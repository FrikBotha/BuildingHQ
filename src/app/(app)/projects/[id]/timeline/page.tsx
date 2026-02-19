import { getTimeline } from "@/data/timeline";
import { TimelinePageContent } from "@/components/timeline/timeline-page-content";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const timeline = await getTimeline(id);

  return <TimelinePageContent projectId={id} initialTimeline={timeline} />;
}
