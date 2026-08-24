import ItemDetailClient from "./item-detail-client";

export const runtime = "edge";

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  return <ItemDetailClient itemId={params.id} />;
}
