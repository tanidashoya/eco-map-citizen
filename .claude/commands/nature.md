---
name: nature-mapping-app
description: 市民による地域自然環境データの収集・可視化アプリ。Next.js App Router + TypeScript + Google スプレッドシート/ドライブ連携。
---

# 地域自然環境マッピングアプリ 開発スキル

## 概要

市民が投稿した自然環境データを処理し、Google マイマップで可視化するアプリケーション。

## データフロー

```
[Googleフォーム]
      ↓ 自動連携
[user_input シート] ← 生データ（1行に複数画像URL）
      ↓ ① transfer-to-formatted.ts
[formatted_data シート] ← 1行1画像URLに展開
      ↓ ② extract-image-location.ts
      ↓ ③ fetch-address.ts
[formatted_data シート] ← 位置情報・住所追記済み
      ↓ ④ generate-kml-formatted.ts
[KMLファイル] → マイマップにインポート

      ↓ ⑤ merge-nearby-locations.ts
[merge_location_data シート] ← 30m圏内を統合
      ↓ ⑥ generate-kml-merged.ts
[KMLファイル（統合版）] → マイマップにインポート
```

---

## スプレッドシート構成

### user_input シート（Googleフォームからの入力）

| 列 | 項目名 | 説明 |
|----|--------|------|
| A | タイムスタンプ | 自動入力 |
| B | ユーザーの名前 | |
| C | ユーザーの住所 | プルダウン |
| D | 生年月日 | |
| E | 生物・景観の画像 | カンマ区切りで複数URL |
| F | この場所について一言 | |

### formatted_data シート（展開後）

| 列 | 項目名 | 説明 |
|----|--------|------|
| A | 元ID | user_inputのタイムスタンプ |
| B | ユーザーの名前 | |
| C | ユーザーの住所 | |
| D | 生年月日 | |
| E | 画像URL | 1行1URL |
| F | この場所について一言 | |
| G | 緯度 | ②で取得 |
| H | 経度 | ②で取得 |
| I | 撮影日時 | ②で取得 |
| J | 住所 | ③で取得 |
| K | 処理済みフラグ | boolean |

### merge_location_data シート（統合後）

| 列 | 項目名 | 説明 |
|----|--------|------|
| A | グループID | 統合グループの識別子 |
| B | 代表緯度 | グループの中心緯度 |
| C | 代表経度 | グループの中心経度 |
| D | 画像URL一覧 | カンマ区切りで統合 |
| E | コメント一覧 | 改行区切りで統合 |
| F | 住所 | |
| G | データ件数 | 統合された件数 |

---

## lib/ ファイル構成

### types.ts - 型定義

```typescript
// lib/types.ts

/** Server Actionの統一戻り値 */
export type ActionResponse = {
  success: boolean;
  message: string;
  processedCount?: number;
};

/** user_inputシートの1行 */
export type UserInputRow = {
  timestamp: string;
  userName: string;
  userAddress: string;
  birthDate: string;
  imageUrls: string;  // カンマ区切り
  comment: string;
};

/** formatted_dataシートの1行 */
export type FormattedDataRow = {
  originalId: string;
  userName: string;
  userAddress: string;
  birthDate: string;
  imageUrl: string;   // 1URL
  comment: string;
  latitude: number | null;
  longitude: number | null;
  photoDateTime: string | null;
  address: string | null;
  processed: boolean;
};

/** merge_location_dataシートの1行 */
export type MergedLocationRow = {
  groupId: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  comments: string[];
  address: string;
  count: number;
};

/** KML生成用のポイントデータ */
export type MapPoint = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  comment?: string;
};
```

### google-api.ts - Google API共通処理

```typescript
// lib/google-api.ts
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

// ========== スプレッドシート操作 ==========

export async function getSheetData(sheetName: string, range: string): Promise<string[][]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return response.data.values || [];
}

export async function appendSheetData(sheetName: string, values: any[][]): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

export async function updateSheetCell(
  sheetName: string,
  cell: string,
  value: any
): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

export async function clearSheet(sheetName: string, range: string): Promise<void> {
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
}

// ========== ドライブ操作 ==========

export function extractFileId(url: string): string | null {
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

export async function getImageBuffer(fileId: string): Promise<Buffer> {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(response.data as ArrayBuffer);
}

// ========== Geocoding ==========

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ja`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].formatted_address;
  }
  return null;
}
```

---

## 6つの機能ファイル

### ① transfer-to-formatted.ts

user_input → formatted_data への転記。複数画像URLを1行1URLに展開。

```typescript
// lib/transfer-to-formatted.ts
import { getSheetData, appendSheetData } from "./google-api";
import type { ActionResponse } from "./types";

export async function transferToFormatted(): Promise<ActionResponse> {
  // 1. user_inputから未処理データを取得
  const userInputData = await getSheetData("user_input", "A:F");
  if (userInputData.length <= 1) {
    return { success: true, message: "転記するデータがありません", processedCount: 0 };
  }

  // 2. formatted_dataの既存IDを取得（重複防止）
  const existingData = await getSheetData("formatted_data", "A:A");
  const existingIds = new Set(existingData.slice(1).map(row => row[0]));

  // 3. 展開してformatted_dataに追記
  const newRows: string[][] = [];
  
  for (const row of userInputData.slice(1)) {
    const [timestamp, userName, userAddress, birthDate, imageUrls, comment] = row;
    
    // 既に転記済みならスキップ
    if (existingIds.has(timestamp)) continue;
    
    // 画像URLをカンマで分割して展開
    const urls = imageUrls.split(",").map(u => u.trim()).filter(u => u);
    
    for (const url of urls) {
      newRows.push([
        timestamp,      // 元ID
        userName,
        userAddress,
        birthDate,
        url,            // 1URL
        comment,
        "",             // 緯度（後で取得）
        "",             // 経度
        "",             // 撮影日時
        "",             // 住所
        "FALSE",        // 処理済みフラグ
      ]);
    }
  }

  if (newRows.length === 0) {
    return { success: true, message: "新しいデータがありません", processedCount: 0 };
  }

  await appendSheetData("formatted_data", newRows);

  return {
    success: true,
    message: `${newRows.length}行を転記しました`,
    processedCount: newRows.length,
  };
}
```

### ② extract-image-location.ts

画像から緯度・経度・撮影日時を取得。

```typescript
// lib/extract-image-location.ts
import ExifParser from "exif-parser";
import { getSheetData, updateSheetCell, extractFileId, getImageBuffer } from "./google-api";
import type { ActionResponse } from "./types";

export async function extractImageLocation(): Promise<ActionResponse> {
  // 1. formatted_dataから位置情報未取得の行を取得
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return { success: true, message: "処理するデータがありません", processedCount: 0 };
  }

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const imageUrl = row[4];
    const latitude = row[6];
    const processed = row[10];

    // 既に処理済み or 緯度がある場合はスキップ
    if (processed === "TRUE" || latitude) continue;

    const fileId = extractFileId(imageUrl);
    if (!fileId) continue;

    try {
      const buffer = await getImageBuffer(fileId);
      const parser = ExifParser.create(buffer);
      const result = parser.parse();
      const tags = result.tags;

      const rowNum = i + 1; // 1-indexed

      if (tags.GPSLatitude && tags.GPSLongitude) {
        await updateSheetCell("formatted_data", `G${rowNum}`, tags.GPSLatitude);
        await updateSheetCell("formatted_data", `H${rowNum}`, tags.GPSLongitude);
        updatedCount++;
      }

      if (tags.DateTimeOriginal) {
        const dateTime = new Date(tags.DateTimeOriginal * 1000).toISOString();
        await updateSheetCell("formatted_data", `I${rowNum}`, dateTime);
      }

      await updateSheetCell("formatted_data", `K${rowNum}`, "TRUE");
    } catch (error) {
      console.error(`画像処理エラー (行${i + 1}):`, error);
      // エラーでも処理済みにする
      await updateSheetCell("formatted_data", `K${i + 1}`, "TRUE");
    }
  }

  return {
    success: true,
    message: `${updatedCount}件の位置情報を取得しました`,
    processedCount: updatedCount,
  };
}
```

### ③ fetch-address.ts

緯度・経度から住所を取得。

```typescript
// lib/fetch-address.ts
import { getSheetData, updateSheetCell, reverseGeocode } from "./google-api";
import type { ActionResponse } from "./types";

export async function fetchAddress(): Promise<ActionResponse> {
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return { success: true, message: "処理するデータがありません", processedCount: 0 };
  }

  let updatedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const latitude = parseFloat(row[6]);
    const longitude = parseFloat(row[7]);
    const existingAddress = row[9];

    // 緯度経度がない or 既に住所がある場合はスキップ
    if (isNaN(latitude) || isNaN(longitude) || existingAddress) continue;

    try {
      const address = await reverseGeocode(latitude, longitude);
      if (address) {
        await updateSheetCell("formatted_data", `J${i + 1}`, address);
        updatedCount++;
      }

      // API制限対策（100ms待機）
      await new Promise(resolve => setTimeout(resolve, 100));
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
```

### ④ generate-kml-formatted.ts

formatted_dataからKML生成。

```typescript
// lib/generate-kml-formatted.ts
import { getSheetData } from "./google-api";
import type { ActionResponse, MapPoint } from "./types";

export async function generateKmlFormatted(): Promise<ActionResponse & { content?: string }> {
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return { success: true, message: "出力するデータがありません" };
  }

  // 緯度・経度があるデータのみ抽出
  const points: MapPoint[] = data
    .slice(1)
    .filter(row => row[6] && row[7])
    .map(row => ({
      name: row[9] || "撮影地点",  // 住所 or デフォルト
      description: row[1] || "匿名",
      latitude: parseFloat(row[6]),
      longitude: parseFloat(row[7]),
      imageUrls: [row[4]],
      comment: row[5],
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

function buildKML(points: MapPoint[], title: string): string {
  const placemarks = points.map(point => {
    const imageHtml = point.imageUrls
      .map(url => `<img src="${url}" width="400" style="max-width:100%;" />`)
      .join("<br/>");

    const description = `
      ${imageHtml}
      <p><strong>投稿者:</strong> ${escapeXml(point.description)}</p>
      ${point.comment ? `<p><strong>コメント:</strong> ${escapeXml(point.comment)}</p>` : ""}
    `.trim();

    return `
    <Placemark>
      <name>${escapeXml(point.name)}</name>
      <description><![CDATA[${description}]]></description>
      <Point>
        <coordinates>${point.longitude},${point.latitude},0</coordinates>
      </Point>
    </Placemark>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

### ⑤ merge-nearby-locations.ts

30m圏内の地点を統合。

```typescript
// lib/merge-nearby-locations.ts
import { getSheetData, clearSheet, appendSheetData } from "./google-api";
import type { ActionResponse, MergedLocationRow } from "./types";

const MERGE_DISTANCE_METERS = 30;

export async function mergeNearbyLocations(): Promise<ActionResponse> {
  const data = await getSheetData("formatted_data", "A:K");
  if (data.length <= 1) {
    return { success: true, message: "統合するデータがありません", processedCount: 0 };
  }

  // 緯度・経度があるデータのみ
  const validRows = data.slice(1).filter(row => row[6] && row[7]);

  // グループ化
  const groups: MergedLocationRow[] = [];
  const used = new Set<number>();

  for (let i = 0; i < validRows.length; i++) {
    if (used.has(i)) continue;

    const baseRow = validRows[i];
    const baseLat = parseFloat(baseRow[6]);
    const baseLng = parseFloat(baseRow[7]);

    const group: MergedLocationRow = {
      groupId: `group-${groups.length + 1}`,
      latitude: baseLat,
      longitude: baseLng,
      imageUrls: [baseRow[4]],
      comments: baseRow[5] ? [baseRow[5]] : [],
      address: baseRow[9] || "",
      count: 1,
    };

    used.add(i);

    // 30m以内の地点を探す
    for (let j = i + 1; j < validRows.length; j++) {
      if (used.has(j)) continue;

      const targetRow = validRows[j];
      const targetLat = parseFloat(targetRow[6]);
      const targetLng = parseFloat(targetRow[7]);

      const distance = calculateDistance(baseLat, baseLng, targetLat, targetLng);

      if (distance <= MERGE_DISTANCE_METERS) {
        group.imageUrls.push(targetRow[4]);
        if (targetRow[5]) group.comments.push(targetRow[5]);
        group.count++;
        used.add(j);

        // 中心座標を更新
        group.latitude = (group.latitude * (group.count - 1) + targetLat) / group.count;
        group.longitude = (group.longitude * (group.count - 1) + targetLng) / group.count;
      }
    }

    groups.push(group);
  }

  // merge_location_dataシートをクリアして書き込み
  await clearSheet("merge_location_data", "A2:G");

  const rows = groups.map(g => [
    g.groupId,
    g.latitude,
    g.longitude,
    g.imageUrls.join(", "),
    g.comments.join("\n"),
    g.address,
    g.count,
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

/** 2点間の距離をメートルで計算（ヒュベニの公式簡易版） */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球の半径（メートル）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
```

### ⑥ generate-kml-merged.ts

merge_location_dataからKML生成。

```typescript
// lib/generate-kml-merged.ts
import { getSheetData } from "./google-api";
import type { ActionResponse, MapPoint } from "./types";

export async function generateKmlMerged(): Promise<ActionResponse & { content?: string }> {
  const data = await getSheetData("merge_location_data", "A:G");
  if (data.length <= 1) {
    return { success: true, message: "出力するデータがありません" };
  }

  const points: MapPoint[] = data.slice(1).map(row => ({
    name: row[5] || `${row[6]}件の投稿`,  // 住所 or 件数
    description: `${row[6]}件の投稿を統合`,
    latitude: parseFloat(row[1]),
    longitude: parseFloat(row[2]),
    imageUrls: row[3].split(",").map((u: string) => u.trim()),
    comment: row[4],
  }));

  if (points.length === 0) {
    return { success: true, message: "出力するデータがありません" };
  }

  const kmlContent = buildKML(points, "地域自然環境マッピング（統合版）");

  return {
    success: true,
    message: `${points.length}グループのKMLを生成しました`,
    processedCount: points.length,
    content: kmlContent,
  };
}

function buildKML(points: MapPoint[], title: string): string {
  const placemarks = points.map(point => {
    // 複数画像を並べて表示
    const imageHtml = point.imageUrls
      .map(url => `<img src="${url}" width="300" style="max-width:100%; margin:5px 0;" />`)
      .join("<br/>");

    const description = `
      ${imageHtml}
      <p><strong>投稿者:</strong> ${escapeXml(point.description)}</p>
      ${point.comment ? `<p><strong>コメント:</strong><br/>${escapeXml(point.comment).replace(/\n/g, "<br/>")}</p>` : ""}
    `.trim();

    return `
    <Placemark>
      <name>${escapeXml(point.name)}</name>
      <description><![CDATA[${description}]]></description>
      <Point>
        <coordinates>${point.longitude},${point.latitude},0</coordinates>
      </Point>
    </Placemark>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

---

## Server Actions

```typescript
// app/actions/admin.ts
"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { transferToFormatted } from "@/lib/transfer-to-formatted";
import { extractImageLocation } from "@/lib/extract-image-location";
import { fetchAddress } from "@/lib/fetch-address";
import { generateKmlFormatted } from "@/lib/generate-kml-formatted";
import { mergeNearbyLocations } from "@/lib/merge-nearby-locations";
import { generateKmlMerged } from "@/lib/generate-kml-merged";
import type { ActionResponse } from "@/lib/types";

// ① 転記
export async function transferAction(): Promise<ActionResponse> {
  try {
    return await transferToFormatted();
  } catch (error) {
    console.error("転記エラー:", error);
    return { success: false, message: "転記に失敗しました" };
  }
}

// ② 位置情報取得
export async function extractLocationAction(): Promise<ActionResponse> {
  try {
    return await extractImageLocation();
  } catch (error) {
    console.error("位置情報取得エラー:", error);
    return { success: false, message: "位置情報の取得に失敗しました" };
  }
}

// ③ 住所取得
export async function fetchAddressAction(): Promise<ActionResponse> {
  try {
    return await fetchAddress();
  } catch (error) {
    console.error("住所取得エラー:", error);
    return { success: false, message: "住所の取得に失敗しました" };
  }
}

// ④ KML生成（個別）
export async function generateKmlFormattedAction(): Promise<ActionResponse & { downloadUrl?: string }> {
  try {
    const result = await generateKmlFormatted();
    if (!result.content) return result;

    const filename = `formatted-${Date.now()}.kml`;
    const dir = join(process.cwd(), "public", "downloads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), result.content, "utf-8");

    return { ...result, downloadUrl: `/downloads/${filename}` };
  } catch (error) {
    console.error("KML生成エラー:", error);
    return { success: false, message: "KML生成に失敗しました" };
  }
}

// ⑤ 近接地点統合
export async function mergeLocationsAction(): Promise<ActionResponse> {
  try {
    return await mergeNearbyLocations();
  } catch (error) {
    console.error("統合エラー:", error);
    return { success: false, message: "統合に失敗しました" };
  }
}

// ⑥ KML生成（統合版）
export async function generateKmlMergedAction(): Promise<ActionResponse & { downloadUrl?: string }> {
  try {
    const result = await generateKmlMerged();
    if (!result.content) return result;

    const filename = `merged-${Date.now()}.kml`;
    const dir = join(process.cwd(), "public", "downloads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), result.content, "utf-8");

    return { ...result, downloadUrl: `/downloads/${filename}` };
  } catch (error) {
    console.error("KML生成エラー:", error);
    return { success: false, message: "KML生成に失敗しました" };
  }
}
```

---

## 環境変数

```env
# .env.local
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_GEOCODING_API_KEY=your_api_key
ADMIN_PASSWORD=your_admin_password
```

---

## 依存パッケージ

```bash
pnpm add googleapis exif-parser
pnpm add -D @types/exif-parser
```

---

## 実装順序

1. Googleフォーム + スプレッドシート準備
2. Next.jsプロジェクト作成
3. lib/types.ts, lib/google-api.ts
4. lib/transfer-to-formatted.ts（①）
5. lib/extract-image-location.ts（②）
6. lib/fetch-address.ts（③）
7. lib/generate-kml-formatted.ts（④）
8. lib/merge-nearby-locations.ts（⑤）
9. lib/generate-kml-merged.ts（⑥）
10. app/actions/admin.ts
11. 認証 + 管理者画面UI
