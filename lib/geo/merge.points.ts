import { calculateDistance } from "./calculate-distance";
import { Point, MergedPoint } from "@/types/maps";

export function mergePoints(points: Point[]): MergedPoint[] {
  const MERGE_DISTANCE_METERS = 20;
  const result: MergedPoint[] = [];

  //pointsはpointWithImagesの配列(1行1データ)
  for (const point of points) {
    let merged = false;

    for (const group of result) {
      const distance = calculateDistance(
        point.lat,
        point.lng,
        group.lat,
        group.lng,
      );

      // すでにあるデータの代表座標と距離が近い場合はマージ
      if (distance <= MERGE_DISTANCE_METERS) {
        group.items.push({
          name: point.name,
          imageUrl: point.imageUrl,
          comment: point.comment,
          shootingDate: point.shootingDate,
        });

        merged = true;
        break;
      }
    }

    // 登録されているデータに近い座標がない場合には新しいデータを追加
    if (!merged) {
      result.push({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        items: [
          {
            name: point.name,
            imageUrl: point.imageUrl,
            comment: point.comment,
            shootingDate: point.shootingDate,
          },
        ],
      });
    }
  }

  return result;
}
