import { getMapPoints } from "@/lib/google-api/google-api";
import MapWrapper from "@/components/map-wrapper";

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
