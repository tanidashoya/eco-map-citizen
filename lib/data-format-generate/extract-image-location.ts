import ExifParser from "exif-parser";
import {
  getSheetData,
  updateSheetRange,
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
  const data = await getSheetData("formatted_data", "A:L");
  if (data.length <= 1) {
    return {
      success: false,
      message: "詳細情報を取得するデータがありません",
      processedCount: 0,
    };
  }

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const imageUrl = row[5]; // F列: 画像URL
    const latitude = row[7]; // H列: 緯度
    const processed = row[11]; // L列: 処理済みフラグ

    // 既に処理済み or 緯度がある場合はスキップ
    if (processed === "TRUE" || latitude) continue;

    //画像URLからファイルIDを抽出(DriveAPIで画像を取得するときに必要)
    const fileId = extractFileId(imageUrl);
    if (!fileId) {
      // ファイルID取得失敗でも処理済みにする
      // await updateSheetRange("formatted_data", `G${i + 1}:K${i + 1}`, [
      //   ["-", "-", "-", "-", "TRUE"],
      // ]);
      // updatedCount++;
      continue;
    }

    try {
      //DriveAPIで画像のバイナリデータを取得(Buffer型で返す)
      const buffer = await getImageBuffer(fileId);
      //画像ファイルに埋め込まれているメタデータを抽出
      const parser = ExifParser.create(buffer);
      //バイナリデータを解析して、EXIFデータを抽出
      const result = parser.parse();
      //result.tagsには緯度・経度・撮影時間などがオブジェクト形式で格納されている
      const tags = result.tags;

      const rowNum = i + 1; // スプレッドシートは1-indexed
      const lat = tags.GPSLatitude ?? "-";
      const lng = tags.GPSLongitude ?? "-";
      const dateTime = tags.DateTimeOriginal
        ? new Date(tags.DateTimeOriginal * 1000).toISOString()
        : "-";

      // H〜L列を一括更新 (H:緯度, I:経度, J:撮影日時, K:撮影住所(空), L:処理済み)
      await updateSheetRange("formatted_data", `H${rowNum}:L${rowNum}`, [
        [lat, lng, dateTime, "", "TRUE"],
      ]);

      if (tags.GPSLatitude && tags.GPSLongitude) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`画像処理エラー (行${i + 1}):`, error);
      // 次回実行時に再処理される（何度も処理してもTRUEが入らない行があるばあには手動で入れるのもあり）
      continue;
    }
  }
  return {
    success: true,
    message: `${updatedCount}件の詳細情報を更新しました`,
    processedCount: updatedCount,
  };
}
