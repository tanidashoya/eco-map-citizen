# Eco Map Citizen

市民による地域自然環境データの収集・可視化アプリケーション

## 概要

Eco Map Citizenは、市民が撮影した自然環境の写真をマップ上で可視化するWebアプリケーションです。Google スプレッドシート/ドライブと連携し、投稿データの管理・表示・KML出力を行います。

## 主な機能

- **マップ表示**: Leafletを使用したインタラクティブな地図表示
- **投稿の可視化**: 写真付きマーカーで投稿位置を表示
- **クラスター表示**: 近接する投稿を自動統合して表示
- **詳細表示**: 投稿の詳細情報（撮影者、日時、場所、コメント）をSheet UIで表示
- **現在地表示**: ユーザーの現在位置をリアルタイム表示
- **Googleマップ連携**: 投稿位置への経路案内
- **地図タイプ切替**: 標準地図/航空写真の切り替え
- **管理機能**: データ処理パイプライン（EXIF抽出、逆ジオコーディング、KML生成）

## 技術スタック

| カテゴリ | 技術 |
|---------|-----|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS 4 |
| UIコンポーネント | shadcn/ui (Radix UI) |
| マップ | Leaflet / React-Leaflet |
| 外部API | Google Sheets API, Google Drive API, Google Geocoding API |
| アイコン | Lucide React |
| 通知 | Sonner |

## セットアップ

### 必要条件

- Node.js 18以上
- pnpm（推奨）またはnpm/yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd eco-map-citizen

# 依存関係をインストール
pnpm install
```

### 環境変数

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください。

```env
# Google API認証
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google スプレッドシート
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# Google Geocoding API
GOOGLE_GEOCODING_API_KEY=your-geocoding-api-key

# 地図タイル設定
NEXT_PUBLIC_MAP_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
NEXT_PUBLIC_MAP_URL_PIC=https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg
NEXT_PUBLIC_MAP_ATTRIBUTION_PIC=&copy; 国土地理院

# 管理画面認証
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### 開発サーバーの起動

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## ディレクトリ構造

```
eco-map-citizen/
├── app/
│   ├── layout.tsx              # ルートレイアウト
│   ├── globals.css             # グローバルスタイル
│   ├── actions/                # Server Actions
│   │   ├── action-admin.ts     # 管理機能
│   │   ├── action-data-format.ts # データ処理パイプライン
│   │   └── action-kml-merge-locate.ts # KML出力
│   └── (private)/
│       ├── page.tsx            # メインマップページ
│       └── admin/
│           └── page.tsx        # 管理者画面
├── components/
│   ├── Map.tsx                 # メインマップコンポーネント
│   ├── map-wrapper.tsx         # マップラッパー（SSR無効化）
│   ├── map-leaflet.tsx         # Leafletマップ実装
│   ├── location-sheet.tsx      # クラスター一覧Sheet
│   ├── location-sheet-content.tsx # 投稿詳細Sheet
│   ├── location-point.tsx      # 単一ポイント詳細Sheet
│   ├── location-item.tsx       # 一覧内の投稿アイテム
│   ├── current-location-marker.tsx # 現在地マーカー
│   ├── locate-button.tsx       # 現在地ボタン
│   ├── google-map-button.tsx   # Googleマップ経路ボタン
│   ├── header.tsx              # ヘッダー
│   └── ui/                     # shadcn/ui コンポーネント
├── lib/
│   ├── google-api/
│   │   └── google-api.ts       # Google API連携
│   ├── geo/
│   │   ├── calculate-distance.ts # 距離計算（Haversine公式）
│   │   └── merge.points.ts     # 近接ポイント統合
│   ├── map/
│   │   ├── create-custom-icon.ts # カスタムマーカーアイコン
│   │   └── use-current-location.ts # 現在地取得フック
│   ├── kml-generate/           # KML生成ユーティリティ
│   └── data-format-generate/   # データ処理ユーティリティ
├── types/
│   ├── maps/index.ts           # マップ関連型定義
│   └── data-format-generate/   # データ処理型定義
└── proxy.ts                    # 管理画面Basic認証
```

## データフロー

```
Google スプレッドシート (user_input)
    ↓ transferToFormatted()
formatted_data（1行1画像に展開）
    ↓ extractImageLocation()
EXIF情報抽出（緯度・経度・撮影日時）
    ↓ fetchAddress()
逆ジオコーディング（住所取得）
    ↓ mergeNearbyLocations()
近接地点統合（5m以内を統合）
    ↓
merge_location_data
    ↓
マップ表示 / KML出力
```

## 主要コンポーネント

### マップ関連

| コンポーネント | 説明 |
|--------------|------|
| `Map.tsx` | マーカー表示・クリックイベント処理 |
| `map-wrapper.tsx` | SSR無効化・現在地管理 |
| `map-leaflet.tsx` | Leaflet描画レイヤー |
| `current-location-marker.tsx` | 青いドット＋パルスアニメーション |

### Sheet UI（多層構造）

```
マップ → LocationSheet（一覧） → LocationSheetContent（詳細）
      → LocationPoint（単一ポイント詳細）
```

詳細Sheetが開くと、一覧Sheetは視覚的に非アクティブ化されます（brightness-30）。

## デプロイ

### Vercel

```bash
# Vercel CLIでデプロイ
vercel

# 本番デプロイ
vercel --prod
```

環境変数はVercelダッシュボードの「Settings > Environment Variables」で設定してください。

## ライセンス

Private

## 作成者

個人プロジェクト
