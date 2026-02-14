import ExifParser from "exif-parser";
import {
  getSheetData,
  updateSheetCell,
  extractFileId,
  getImageBuffer,
} from "@/lib/google-api/google-api";
import type { ActionResponse } from "@/types/data-format-generate/types";

/**
 * ② 画像から緯度・経度・撮影日時を取得
 * Google Driveから画像をダウンロードしてEXIF情報を抽出
 */
export async function extractImageLocation(): Promise<ActionResponse> {
  // 1. formatted_dataから全行を取得
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return {
      success: true,
      message: "処理するデータがありません",
      processedCount: 0,
    };
  }

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const imageUrl = row[4]; // E列: 画像URL
    const latitude = row[6]; // G列: 緯度
    const processed = row[10]; // K列: 処理済みフラグ

    // 既に処理済み or 緯度がある場合はスキップ
    if (processed === "TRUE" || latitude) continue;

    const fileId = extractFileId(imageUrl);
    if (!fileId) {
      // ファイルID取得失敗でも処理済みにする
      await updateSheetCell("formatted_data", `K${i + 1}`, "TRUE");
      continue;
    }

    try {
      const buffer = await getImageBuffer(fileId);
      const parser = ExifParser.create(buffer);
      const result = parser.parse();
      const tags = result.tags;

      const rowNum = i + 1; // スプレッドシートは1-indexed

      if (tags.GPSLatitude && tags.GPSLongitude) {
        await updateSheetCell("formatted_data", `G${rowNum}`, tags.GPSLatitude);
        await updateSheetCell(
          "formatted_data",
          `H${rowNum}`,
          tags.GPSLongitude,
        );
        updatedCount++;
      }

      if (tags.DateTimeOriginal) {
        const dateTime = new Date(tags.DateTimeOriginal * 1000).toISOString();
        await updateSheetCell("formatted_data", `I${rowNum}`, dateTime);
      }

      await updateSheetCell("formatted_data", `K${rowNum}`, "TRUE");
    } catch (error) {
      console.error(`画像処理エラー (行${i + 1}):`, error);
      // エラーでも処理済みにする（再処理を防ぐ）
      await updateSheetCell("formatted_data", `K${i + 1}`, "TRUE");
    }
  }

  return {
    success: true,
    message: `${updatedCount}件の位置情報を取得しました`,
    processedCount: updatedCount,
  };
}
