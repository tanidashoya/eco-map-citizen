import {
  getSheetData,
  clearSheet,
  appendSheetData,
} from "../google-api/google-api";
import type {
  ActionResponse,
  MergedLocationRow,
} from "../../types/data-format-generate/types";

const MERGE_DISTANCE_METERS = 30;

/**
 * ⑤ 30m圏内の地点を統合
 * formatted_dataから近接する投稿をグループ化してmerge_location_dataに保存
 */
export async function mergeNearbyLocations(): Promise<ActionResponse> {
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return {
      success: true,
      message: "統合するデータがありません",
      processedCount: 0,
    };
  }

  // 緯度・経度があるデータのみ抽出
  const validRows = data.slice(1).filter((row) => row[6] && row[7]);

  if (validRows.length === 0) {
    return {
      success: true,
      message: "位置情報を持つデータがありません",
      processedCount: 0,
    };
  }

  // グループ化
  const groups: MergedLocationRow[] = [];
  const used = new Set<number>();

  for (let i = 0; i < validRows.length; i++) {
    if (used.has(i)) continue;

    const baseRow = validRows[i];
    const baseLat = parseFloat(baseRow[6]);
    const baseLng = parseFloat(baseRow[7]);

    const group: MergedLocationRow = {
      groupId: `group-${groups.length + 1}`,
      latitude: baseLat,
      longitude: baseLng,
      imageUrls: [baseRow[4]], // E列: 画像URL
      comments: baseRow[5] ? [baseRow[5]] : [], // F列: コメント
      address: baseRow[9] || "", // J列: 住所
      count: 1,
    };

    used.add(i);

    // 30m以内の地点を探す
    for (let j = i + 1; j < validRows.length; j++) {
      if (used.has(j)) continue;

      const targetRow = validRows[j];
      const targetLat = parseFloat(targetRow[6]);
      const targetLng = parseFloat(targetRow[7]);

      const distance = calculateDistance(
        baseLat,
        baseLng,
        targetLat,
        targetLng,
      );

      if (distance <= MERGE_DISTANCE_METERS) {
        group.imageUrls.push(targetRow[4]);
        if (targetRow[5]) group.comments.push(targetRow[5]);
        group.count++;
        used.add(j);

        // 中心座標を更新（移動平均）
        group.latitude =
          (group.latitude * (group.count - 1) + targetLat) / group.count;
        group.longitude =
          (group.longitude * (group.count - 1) + targetLng) / group.count;
      }
    }

    groups.push(group);
  }

  // merge_location_dataシートをクリアして書き込み
  await clearSheet("merge_location_data", "A2:G");

  const rows = groups.map((g) => [
    g.groupId, // A: グループID
    g.latitude, // B: 代表緯度
    g.longitude, // C: 代表経度
    g.imageUrls.join(", "), // D: 画像URL一覧
    g.comments.join("\n"), // E: コメント一覧
    g.address, // F: 住所
    g.count, // G: データ件数
  ]);

  if (rows.length > 0) {
    await appendSheetData("merge_location_data", rows);
  }

  return {
    success: true,
    message: `${validRows.length}件を${groups.length}グループに統合しました`,
    processedCount: groups.length,
  };
}

/**
 * 2点間の距離をメートルで計算（Haversine公式）
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
