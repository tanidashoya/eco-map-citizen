import {
  getSheetData,
  updateSheetCell,
  reverseGeocode,
} from "../google-api/google-api";
import type { ActionResponse } from "../../types/data-format-generate/types";

/**
 * ③ 緯度・経度から住所を取得
 * Google Geocoding APIを使用して逆ジオコーディング
 */
export async function fetchAddress(): Promise<ActionResponse> {
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
    const latitude = parseFloat(row[6]); // G列: 緯度
    const longitude = parseFloat(row[7]); // H列: 経度
    const existingAddress = row[9]; // J列: 住所

    // 緯度経度がない or 既に住所がある場合はスキップ
    if (isNaN(latitude) || isNaN(longitude) || existingAddress) continue;

    try {
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        await updateSheetCell("formatted_data", `J${i + 1}`, address);
        updatedCount++;
      }

      // API制限対策（100ms待機）
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`住所取得エラー (行${i + 1}):`, error);
    }
  }

  return {
    success: true,
    message: `${updatedCount}件の住所を取得しました`,
    processedCount: updatedCount,
  };
}
