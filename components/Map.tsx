"use client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocateButton from "./locate-button";
import { ClusterItem, MapProps, MergedPoint } from "@/types/maps";
import Header from "./header";
import LocationDialog from "./location-dialog";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
// } from "@/components/ui/sheet";
import { useState } from "react";
import LocationSheet from "./location-sheet";
import { useRouter } from "next/navigation";

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

export default function Map({ mergedPoints, initialCenter }: MapProps) {
  const [selectedPoint, setSelectedPoint] = useState<MergedPoint | null>(null);
  const DEFAULT_ZOOM = 13;
  const router = useRouter();

  const handleClick = (point: MergedPoint) => {
    console.log("clicked", point);
    setSelectedPoint(point);
    if (point.items.length === 1) {
      router.push(`/?point=${point.items[0].uniqueId}`);
    } else {
      router.push(`/?cluster=${point.lat}-${point.lng}`);
    }
  };
  return (
    <>
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
        className="flex flex-col justify-center items-center"
      >
        <Header />
        <TileLayer
          attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION}
          url={process.env.NEXT_PUBLIC_MAP_URL ?? ""}
          className="map-minimal"
        />
        {mergedPoints.map((point, index) => (
          <Marker
            key={`${point.lat}-${point.lng}-${index}`}
            position={[point.lat, point.lng]}
            eventHandlers={{
              click: () => handleClick(point),
            }}
          />
        ))}
        <LocateButton />
      </MapContainer>
      <LocationSheet selectedPoint={selectedPoint as MergedPoint} />
      <LocationDialog selectedItem={selectedPoint?.items[0] as ClusterItem} />
    </>
  );
}
