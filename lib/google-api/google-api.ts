import { google } from "googleapis";

//credentialsを使用してGoogle APIに接続:登録済みのサービスアカウントのメールアドレスと秘密鍵を使用して認証
//scopes:何を操作できるかの権限指定（googleのドキュメントに記載）
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets", //スプレッドシートの読み書き
    "https://www.googleapis.com/auth/drive.readonly", //ドライブの読み込み
  ],
});

const sheets = google.sheets({ version: "v4", auth }); //Sheets API用のクライアントを作っている
const drive = google.drive({ version: "v3", auth }); //Drive API用のクライアントを作っている

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ========== スプレッドシート操作 ==========

//スプレッドシートのデータを取得
//values:スプレッドシートのデータを取得して返す(string[][]型)⇒ [[A1,B1,C1],[A2,B2,C2]]
//goole-sheets-apiはセルの型をそのまま返す。
//ここでの型定義・型アサーションは実行時の検証は行わず、開発時に「ここでは string[][] として扱う」と明示しているだけ
export async function getSheetData(
  sheetName: string,
  range: string,
): Promise<string[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return (response.data.values as string[][]) || [];
}

//指定したシート（sheetName）にデータ（values）を追加(append:指定した範囲の“最後”にデータを追加する)
export async function appendSheetData(
  sheetName: string,
  values: (string | number | boolean)[][],
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED", //USER_ENTERED:ユーザーが入力した値をそのまま追加
    requestBody: { values }, //values:追加するデータ（string[][]型）
  });
}

// セルを一部更新
export async function updateSheetCell(
  sheetName: string,
  cell: string,
  value: string | number | boolean,
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] }, //rangeで指定したセルにvalueを更新
  });
}

// 範囲を一括更新
export async function updateSheetRange(
  sheetName: string,
  range: string,
  values: (string | number | boolean)[][],
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values }, //rangeで指定した範囲にvaluesを更新
  });
}

export async function clearSheet(
  sheetName: string,
  range: string,
): Promise<void> {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
}

// ========== ドライブ操作 ==========

//画像URLからファイルIDを抽出
//DriveのファイルID形式が2種類あるので、どちらの形式にも対応
//パターン１:https://drive.google.com/open?id=1ABCxyz

export function extractFileId(url: string): string | null {
  // ?id=xxx 形式
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // /d/xxx 形式
  match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

export async function getImageBuffer(fileId: string): Promise<Buffer> {
  //DriveAPIで画像のバイナリデータを取得(Buffer型で返す)
  //responseType: "arraybuffer" を指定すると、バイナリデータを ArrayBuffer として取得できる(デフォルトではJSON形式で返す)
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  //Buffer型に変換して返す（Node.js のバイナリデータ型）ArrayBuffer型をBuffer型に変換
  //ArrayBuffer はブラウザ由来のバイナリ型で、Node.js では扱いづらい
  return Buffer.from(response.data as ArrayBuffer);
}

// Google Drive URLを表示可能な形式に変換
export function convertDriveUrl(
  driveUrl: string | undefined,
): string | undefined {
  if (!driveUrl) return undefined;
  const fileId = extractFileId(driveUrl);
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return undefined;
}

// ========== Geocoding ==========

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].formatted_address;
  }
  return null;
}

/*
マップ表示用UIに必要なデータを取得
*/
// マップ表示用のデータを取得
export async function getMapPoints() {
  const rows = await getSheetData("formatted_data", "A:Z");

  if (rows.length === 0) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // ヘッダーからインデックスを取得
  const idxId = headers.indexOf("元ID");
  // const idxName = headers.indexOf("ユーザー名");
  const idxLat = headers.indexOf("緯度");
  const idxLng = headers.indexOf("経度");
  const idxImage = headers.indexOf("画像URL");
  const idxComment = headers.indexOf("この場所について");
  const idxDate = headers.indexOf("撮影日時");

  return dataRows
    .filter((row) => row[idxLat] && row[idxLng])
    .map((row) => ({
      id: row[idxId] || "",
      lat: parseFloat(row[idxLat]),
      lng: parseFloat(row[idxLng]),
      // title: row[idxName] || "投稿",
      imageUrl: convertDriveUrl(row[idxImage]),
      comment: row[idxComment] || "",
      shootingDate: row[idxDate] || "",
    }));
}
