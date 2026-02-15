import {
  getSheetData,
  clearSheet,
  appendSheetData,
} from "../google-api/google-api";
import type {
  ActionResponse,
  MergedLocationRow,
} from "../../types/data-format-generate/types";
import { calculateDistance } from "../geo/calculate-distance";

const MERGE_DISTANCE_METERS = 20;

/**
 * ⑤ 20m圏内の地点を統合
 * formatted_dataから近接する投稿をグループ化してmerge_location_dataに保存
 */
export async function mergeNearbyLocations(): Promise<ActionResponse> {
  const data = await getSheetData("formatted_data", "A:L");
  if (data.length <= 1) {
    return {
      success: true,
      message: "統合するデータがありません",
      processedCount: 0,
    };
  }

  // 緯度・経度があるデータのみ抽出
  const validRows = data.slice(1).filter((row) => row[7] && row[8]);

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
    const baseLat = parseFloat(baseRow[7]);
    const baseLng = parseFloat(baseRow[8]);

    const group: MergedLocationRow = {
      groupId: `group-${groups.length + 1}`,
      latitude: baseLat,
      longitude: baseLng,
      imageUrls: [baseRow[5]], // F列: 画像URL
      comments: baseRow[6] ? [baseRow[6]] : [], // G列: この場所について
      address: baseRow[10] || "", // K列: 撮影住所
      count: 1,
    };

    used.add(i);

    // 30m以内の地点を探す
    for (let j = i + 1; j < validRows.length; j++) {
      if (used.has(j)) continue;

      const targetRow = validRows[j];
      const targetLat = parseFloat(targetRow[7]);
      const targetLng = parseFloat(targetRow[8]);

      const distance = calculateDistance(
        baseLat,
        baseLng,
        targetLat,
        targetLng,
      );

      if (distance <= MERGE_DISTANCE_METERS) {
        group.imageUrls.push(targetRow[5]);
        if (targetRow[6]) group.comments.push(targetRow[6]);
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
