import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getSheetData } from "@/lib/google-api/google-api";
import type {
  ActionResponse,
  MapPoint,
} from "../../types/data-format-generate/types";
import { buildKML } from "@/lib/kml-generate/build-kml";
/**
 * ⑥ merge_location_dataからKML生成（統合版）
 * KMLファイルを生成してpublic/downloads/に保存し、ダウンロードURLを返す
 */
export async function generateKmlMerged(): Promise<
  ActionResponse & { downloadUrl?: string }
> {
  const data = await getSheetData("merge_location_data", "A:G");
  if (data.length <= 1) {
    return { success: true, message: "出力するデータがありません" };
  }

  const points: MapPoint[] = data.slice(1).map((row) => ({
    name: row[5] || `${row[6]}件の投稿`, // F列: 住所 or G列: 件数
    description: `${row[6]}件の投稿を統合`, // G列: データ件数
    latitude: parseFloat(row[1]), // B列: 代表緯度
    longitude: parseFloat(row[2]), // C列: 代表経度
    imageUrls: row[3].split(",").map((u: string) => u.trim()), // D列: 画像URL一覧
    comment: row[4], // E列: コメント一覧
  }));

  if (points.length === 0) {
    return { success: true, message: "出力するデータがありません" };
  }

  const kmlContent = buildKML(points, "地域自然環境マッピング（統合版）");

  // ファイル保存
  const filename = `merged-${Date.now()}.kml`;
  const dir = join(process.cwd(), "public", "downloads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), kmlContent, "utf-8");

  return {
    success: true,
    message: `${points.length}グループのKMLを生成しました`,
    processedCount: points.length,
    downloadUrl: `/downloads/${filename}`,
  };
}

/**
 * GoogleドライブURLをマイマップで表示可能な形式に変換
 * https://drive.google.com/... → https://lh3.googleusercontent.com/d/ファイルID
 */
