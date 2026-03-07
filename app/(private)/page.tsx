import { getApprovedObservations } from "@/lib/supabase/queries";
import MapWrapper from "@/components/map/map-wrapper";

// キャッシュを無効化し、常に最新データを取得
export const dynamic = "force-dynamic";

export default async function Home() {
  // Supabaseから承認済みデータを取得
  const points = await getApprovedObservations();

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1">
        <MapWrapper pointsWithImages={points} />
      </main>
    </div>
  );
}
