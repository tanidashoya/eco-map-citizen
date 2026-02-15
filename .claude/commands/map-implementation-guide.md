# マップ機能実装ガイド

## 概要

ルートページ（`/`）にLeaflet + OpenStreetMapでマップを表示し、Googleフォームへの投稿リンクを配置する。

## 前提

- Next.js App Router
- TypeScript
- スプレッドシートに緯度・経度データあり（formatted_dataシート）
- Google Forms URL: `https://forms.gle/n9iQLFwtfD7RfmdaA`

## パッケージインストール

```bash
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet
```

## ファイル構成

```
app/
├── page.tsx                    # ルート：マップ + 投稿リンク
├── components/
│   └── Map.tsx                 # Leafletマップコンポーネント
├── lib/
│   └── sheets.ts               # 既存：スプレッドシート連携（getMapPoints追加）
```

## 実装内容

### 1. Map.tsx（クライアントコンポーネント）

```tsx
// app/components/Map.tsx
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Next.js環境でのアイコン修正
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type Point = {
  id: string
  lat: number
  lng: number
  title: string
  imageUrl?: string
  comment?: string
  shootingDate?: string
}

type MapProps = {
  points: Point[]
}

export default function Map({ points }: MapProps) {
  // データがある場合は最初のポイントを中心に、なければ日本の中心付近
  const defaultCenter: [number, number] = points.length > 0 
    ? [points[0].lat, points[0].lng]
    : [35.6762, 139.6503]

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={10} 
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {points.map(point => (
        <Marker key={point.id} position={[point.lat, point.lng]}>
          <Popup>
            <div style={{ maxWidth: 200 }}>
              <strong>{point.title}</strong>
              {point.shootingDate && <p style={{ fontSize: 12, color: '#666' }}>{point.shootingDate}</p>}
              {point.comment && <p>{point.comment}</p>}
              {point.imageUrl && (
                <img 
                  src={point.imageUrl} 
                  alt={point.title}
                  style={{ width: '100%', marginTop: 8 }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

### 2. page.tsx（ルートページ）

```tsx
// app/page.tsx
import dynamic from 'next/dynamic'
import { getMapPoints } from '@/lib/sheets'

// SSR無効（Leafletはクライアントのみ）
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>マップを読み込み中...</div>
})

const GOOGLE_FORM_URL = 'https://forms.gle/n9iQLFwtfD7RfmdaA'

export default async function Home() {
  const points = await getMapPoints()
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        padding: '12px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #eee'
      }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>環境マッピング</h1>
        <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}>
            投稿する
          </button>
        </a>
      </header>
      <main style={{ flex: 1 }}>
        <Map points={points} />
      </main>
    </div>
  )
}
```

### 3. sheets.ts（データ取得関数を追加）

既存の `sheets.ts` に以下を追加：

```tsx
// app/lib/sheets.ts に追加

export async function getMapPoints() {
  // formatted_data シートからデータ取得
  // 既存のスプレッドシート取得ロジックを使用
  
  const rows = await getSheetData('formatted_data') // 既存関数を想定
  
  return rows
    .filter(row => row.latitude && row.longitude) // 緯度・経度があるもののみ
    .map(row => ({
      id: row.id || row.timestamp,
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      title: row.userName || '投稿',
      imageUrl: convertDriveUrl(row.imageUrl),
      comment: row.comment || '',
      shootingDate: row.shootingDate || ''
    }))
}

// Google Drive URLを表示可能な形式に変換
function convertDriveUrl(driveUrl: string | undefined): string | undefined {
  if (!driveUrl) return undefined
  const match = driveUrl.match(/\/d\/(.+?)\//)
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return driveUrl
}
```

## スプレッドシートのカラム対応

| シートのカラム名 | コード内の変数名 |
|------------------|------------------|
| タイムスタンプ or ID | id |
| ユーザーの名前 | userName → title |
| 画像から緯度 | latitude → lat |
| 画像から経度 | longitude → lng |
| 画像URL | imageUrl |
| この場所について一言 | comment |
| 画像から撮影時間 | shootingDate |

※ 実際のカラム名に応じて `getMapPoints()` 内のプロパティ名を調整すること

## 完了条件

- [ ] `/` にアクセスするとマップが表示される
- [ ] スプレッドシートのデータがピンで表示される
- [ ] ピンをクリックすると詳細（タイトル、コメント、画像）がポップアップ
- [ ] 「投稿する」ボタンでGoogleフォームが新規タブで開く
- [ ] データがない場合もエラーにならない

## 注意事項

- `Map.tsx` は `'use client'` 必須
- `page.tsx` で `dynamic import` + `ssr: false` 必須
- カラム名は実際のスプレッドシートに合わせて調整
