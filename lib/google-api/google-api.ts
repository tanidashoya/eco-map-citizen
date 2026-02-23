import { google } from "googleapis";
import { Readable } from "stream";

// ========== 認証設定 ==========

// サービスアカウント認証（スプレッドシート用）
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets", //スプレッドシートの読み書き
    "https://www.googleapis.com/auth/drive", //ドライブの読み書き
  ],
});

const sheets = google.sheets({ version: "v4", auth }); //Sheets API用のクライアント

// OAuth認証（Drive用 - 個人アカウントとして操作）
// サービスアカウントはストレージ容量が0のため、OAuthリフレッシュトークンを使用
const oauthClient = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
);
oauthClient.setCredentials({
  refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
});
const oauthDrive = google.drive({ version: "v3", auth: oauthClient });

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ========== スプレッドシート操作 ==========

//スプレッドシートのデータを取得
//values:スプレッドシートのデータを取得して返す(string[][]型)⇒ [[A1,B1,C1],[A2,B2,C2]]
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

//指定したシート（sheetName）にデータ（values）を追加
export async function appendSheetData(
  sheetName: string,
  values: (string | number | boolean)[][],
): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
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
    requestBody: { values: [[value]] },
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
    requestBody: { values },
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
export function extractFileId(url: string): string | null {
  // ?id=xxx 形式
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // /d/xxx 形式
  match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

// OAuth認証でDriveから画像を取得
export async function getImageBuffer(fileId: string): Promise<Buffer> {
  const response = await oauthDrive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
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

// OAuth認証でDriveにアップロード
export async function uploadImageToDrive(
  image: Buffer,
  folderId: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "jpg";
  const name = `image_${Date.now()}.${ext}`;
  const response = await oauthDrive.files.create({
    requestBody: {
      name: name,
      mimeType: mimeType,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType,
      body: Readable.from(image),
    },
    fields: "id",
  });

  await oauthDrive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  return `https://drive.google.com/uc?export=view&id=${response.data.id!}`;
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

// ========== マップ表示用 ==========

export async function getMapPoints() {
  const rows = await getSheetData("formatted_data", "A:Z");

  if (rows.length === 0) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // ヘッダーからインデックスを取得
  const idxUniqueId = headers.indexOf("ユニークID");
  const idxStamp = headers.indexOf("タイムスタンプ");
  const idxName = headers.indexOf("ユーザー名");
  const idxLat = headers.indexOf("緯度");
  const idxLng = headers.indexOf("経度");
  const idxImage = headers.indexOf("画像URL");
  const idxComment = headers.indexOf("この場所について");
  const idxDate = headers.indexOf("撮影日時");
  const idxLocation = headers.indexOf("撮影住所");

  return dataRows
    .filter((row) => row[idxLat] && row[idxLng])
    .map((row) => ({
      uniqueId: row[idxUniqueId] || "",
      stamp: row[idxStamp] || "",
      lat: parseFloat(row[idxLat]),
      lng: parseFloat(row[idxLng]),
      name: row[idxName] || "匿名ユーザー",
      imageUrl: convertDriveUrl(row[idxImage]),
      comment: row[idxComment] || "",
      shootingDate: row[idxDate] || "",
      location: row[idxLocation] || "",
    }));
}
