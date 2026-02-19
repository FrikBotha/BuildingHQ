import { listQuotations } from "@/data/quotations";
import { QuotationsPageContent } from "@/components/quotations/quotations-page-content";

export default async function QuotationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quotations = await listQuotations(id);

  return <QuotationsPageContent projectId={id} initialQuotations={quotations} />;
}
