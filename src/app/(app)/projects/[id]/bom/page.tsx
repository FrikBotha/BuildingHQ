import { getBOM } from "@/data/bom";
import BOMPageContent from "@/components/bom/bom-page-content";

export default async function BOMPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bom = await getBOM(id);

  return <BOMPageContent projectId={id} initialBom={bom} />;
}
