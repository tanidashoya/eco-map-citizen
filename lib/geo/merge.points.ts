import { calculateDistance } from "./calculate-distance";
import { Point, MergedPoint } from "@/types/maps";

export function mergePoints(points: Point[]): MergedPoint[] {
  const MERGE_DISTANCE_METERS = 5;
  const result: MergedPoint[] = [];

  //pointsはpointWithImagesの配列(1行1データ)
  for (const point of points) {
    let merged = false;

    for (const group of result) {
      const distance = calculateDistance(
        point.latitude,
        point.longitude,
        group.latitude,
        group.longitude,
      );

      // すでにあるデータの代表座標と距離が近い場合はマージ
      if (distance <= MERGE_DISTANCE_METERS) {
        group.items.push({
          uniqueId: point.uniqueId,
          category: point.category,
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
        latitude: point.latitude,
        longitude: point.longitude,
        items: [
          {
            uniqueId: point.uniqueId,
            category: point.category,
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
