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
    const latStr = row[7]; // H列: 緯度
    const lngStr = row[8]; // I列: 経度
    const existingAddress = row[10]; // K列: 撮影住所
    if (latStr === "-" || lngStr === "-") continue;
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    // 緯度経度がない or 既に住所がある場合はスキップ
    if (isNaN(latitude) || isNaN(longitude) || existingAddress) continue;

    try {
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        await updateSheetCell("formatted_data", `K${i + 1}`, address); //ここでi+1としているのはdataの配列の行番号と一致させるため
        updatedCount++;
      }
      // API制限対策（100ms待機）
      //短時間にGoogle Geocoding APIを叩きすぎるとエラーになるので100ms待機
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`住所取得エラー (行${i + 1}):`, error);
      // 次の行へ。失敗した行は住所が空のままなので次回実行時に再処理される
      continue;
    }
  }

  return {
    success: true,
    message: `${updatedCount}件の住所を取得しました`,
    processedCount: updatedCount,
  };
}
