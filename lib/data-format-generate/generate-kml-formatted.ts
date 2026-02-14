import { buildKML } from "@/lib/kml-generate/build-kml";
import { getSheetData } from "../google-api/google-api";
import type {
  ActionResponse,
  MapPoint,
} from "../../types/data-format-generate/types";
/**
 * ④ formatted_dataからKML生成（個別ポイント版）
 */
export async function generateKmlFormatted(): Promise<
  ActionResponse & { content?: string }
> {
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return { success: true, message: "出力するデータがありません" };
  }

  // 緯度・経度があるデータのみ抽出
  const points: MapPoint[] = data
    .slice(1)
    .filter((row) => row[6] && row[7])
    .map((row) => ({
      name: row[9] || "撮影地点", // J列: 住所 or デフォルト
      description: row[1] || "匿名", // B列: ユーザー名
      latitude: parseFloat(row[6]), // G列: 緯度
      longitude: parseFloat(row[7]), // H列: 経度
      imageUrls: [row[4]], // E列: 画像URL
      comment: row[5], // F列: コメント
    }));

  if (points.length === 0) {
    return { success: true, message: "位置情報を持つデータがありません" };
  }

  const kmlContent = buildKML(points, "地域自然環境マッピング（個別）");

  return {
    success: true,
    message: `${points.length}件のデータでKMLを生成しました`,
    processedCount: points.length,
    content: kmlContent,
  };
}
