import { ChangeDetailView } from "@/components/changes/change-detail-view";

export default async function ChangePage({ params }: { params: Promise<{ changeId: string }> }) {
  const { changeId } = await params;
  return <ChangeDetailView changeId={changeId} />;
}
