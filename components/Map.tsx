"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocateButton from "./locate-button";
import { MapProps } from "@/types/maps";
import Header from "./header";
import InitialLocation from "./initial-location";

// Next.js環境でのアイコン修正
//Leafletの内部関数：_getIconUrlを削除⇒「勝手に探すな」（これがなければLeafletが自動的にアイコンを探しに行ってしまう）【Next.js環境ではエラーが発生するため】
//このメソッド(getIconUrl)の役割は：👉 「デフォルトマーカー画像のパスを決める」
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as Record<string, any>)._getIconUrl;

// Leafletのマーカーアイコンを設定
//アイコンを自動で探すメソッド（getIconURL）が削除されたので、手動でパスを指定(Leafletのデフォルトマーカー設定を書き換えている部分。)
//mergeOptionsとは？：既存のオプションを壊さずに、指定したプロパティだけ上書きするメソッド
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png", //高解像度のマーカー（Retinaディスプレイ用）スマホ・MAC
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png", //通常解像時のマーカー
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png", //影の画像
});

export default function Map({ pointsWithImages }: MapProps) {
  const defaultCenter: [number, number] =
    pointsWithImages.length > 0
      ? [pointsWithImages[0].lat, pointsWithImages[0].lng]
      : [34.78, 132.86]; // 広島付近（データに合わせて調整）

  const DEFAULT_ZOOM = 13;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      className="flex flex-col justify-center items-center"
    >
      <InitialLocation />
      <Header />
      <TileLayer
        attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION}
        url={process.env.NEXT_PUBLIC_MAP_URL ?? ""}
        className="map-minimal"
      />
      {pointsWithImages.map((point, index) => (
        <Marker key={`${point.id}-${index}`} position={[point.lat, point.lng]}>
          <Popup>
            <div style={{ maxWidth: 200 }}>
              {/* <strong>{point.title}</strong> */}
              {point.shootingDate && (
                <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>
                  {point.shootingDate}
                </p>
              )}
              {point.comment && (
                <p style={{ margin: "4px 0" }}>{point.comment}</p>
              )}
              {point.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={point.imageUrl}
                  alt="投稿画像"
                  style={{ width: "100%", marginTop: 8 }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <LocateButton />
    </MapContainer>
  );
}
