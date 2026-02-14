import { getSheetData, appendSheetData } from "@/lib/google-api/google-api";
import type { ActionResponse } from "../../types/data-format-generate/types";

/**
 * ① user_input → formatted_data への転記
 * 複数画像URLを1行1URLに展開する
 */
export async function transferToFormatted(): Promise<ActionResponse> {
  // 1. user_inputから全データを取得
  const userInputAllData = await getSheetData("user_input", "A:F");

  if (userInputAllData.length <= 1) {
    return {
      success: false,
      message: "転記するデータがありません",
      processedCount: 0,
    };
  }

  // 2. formatted_dataの既存IDを取得（重複防止）
  const existingData = await getSheetData("formatted_data", "A:A");
  const existingIds = new Set(existingData.slice(1).map((row) => row[0])); //1行目はヘッダーなのでスキップ

  // 3. 展開してformatted_dataに追記
  const newRows: string[][] = [];

  for (const row of userInputAllData.slice(1)) {
    const [timestamp, userName, userAddress, birthDate, imageUrls, comment] =
      row;

    // 既に転記済みならスキップ
    //集合(Set)のhasメソッドで、timestampが既に存在するかどうかを確認（存在していたらスキップ）
    if (existingIds.has(timestamp)) continue;
    //画像URLがない場合はスキップ
    if (!imageUrls) continue;
    // 画像URLをカンマで分割して展開
    const urls = imageUrls.split(",").map((url) => url.trim());

    //繰り返し分の入れ子構造でnewRowsに追加
    for (const url of urls) {
      newRows.push([
        timestamp, // A: 元ID
        userName || "", // B: ユーザーの名前
        userAddress || "", // C: ユーザーの住所
        birthDate || "", // D: 生年月日
        url, // E: 画像URL（1URL）
        comment || "", // F: この場所について一言
        "", // G: 緯度（後で取得）
        "", // H: 経度
        "", // I: 撮影日時
        "", // J: 住所
        "FALSE", // K: 処理済みフラグ
      ]);
    }
  }

  if (newRows.length === 0) {
    return {
      success: false,
      message: "新しいデータがありません",
      processedCount: 0,
    };
  }

  //指定したシート（formatted_data）にデータ（newRows）を追加
  //引数リレー方式の場合にはここではスプレッドシートに書き込まず次の関数（extractImageLocation）にnewRowsを引数で渡す
  await appendSheetData("formatted_data", newRows);

  return {
    success: true,
    message: `${newRows.length}行を転記しました`,
    processedCount: newRows.length,
  };
}
