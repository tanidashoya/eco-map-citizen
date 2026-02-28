import { getMapPoints } from "@/lib/google-api/google-api";
import MapWrapper from "@/components/map-wrapper";

// キャッシュを無効化し、常に最新データを取得
export const dynamic = "force-dynamic";

export default async function Home() {
  // マップ表示用のデータを取得
  //画像がない場合にはundefinedになるので、undefinedを削除
  const points = await getMapPoints();
  const pointsWithImages = points.filter(
    (point) => point.imageUrl !== undefined,
  );

  return (
    <div className="h-screen flex flex-col">
      <main className="flex-1">
        <MapWrapper pointsWithImages={pointsWithImages} />
      </main>
    </div>
  );
}
