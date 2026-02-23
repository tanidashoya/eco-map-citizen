"use client";
import { Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapProps, MergedPoint } from "@/types/maps";
import Header from "./header";
import LocationSheet from "./location-sheet";
import { useRouter } from "next/navigation";
import LocationDetailSheet from "./location-detail-sheet";
import MapTypeButton from "./map-type-button";
import createCustomIcon from "@/lib/map/create-custom-icon";
import { useState, useMemo, useCallback } from "react";
import Attribution from "./attribution";
import MapLeaflet from "./map-leaflet";

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

export default function Map({
  mergedPoints,
  initialCenter,
  currentLocation,
  isLocationLoading,
}: MapProps) {
  const [selectedPoint, setSelectedPoint] = useState<MergedPoint | null>(null);
  const [mapTypePic, setMapTypePic] = useState(true);

  const router = useRouter();

  const handleMapType = () => {
    setMapTypePic(!mapTypePic);
  };

  // useCallbackでメモ化してuseMemoの依存配列が安定するようにする
  const handleClick = useCallback(
    (point: MergedPoint) => {
      setSelectedPoint(point);
      if (point.items.length === 1) {
        router.push(`/?point=${point.items[0].uniqueId}`);
      } else {
        router.push(`/?cluster=${point.lat}-${point.lng}`);
      }
    },
    [router],
  );

  // マーカーをメモ化してiconの再生成を防ぐ
  // mergedPointsが変わった時だけ再生成される
  const markers = useMemo(() => {
    return mergedPoints.map((point, index) => {
      const icon = createCustomIcon(
        point.items[0].imageUrl ?? "",
        point.items.length,
      );
      return (
        <Marker
          key={`${point.lat}-${point.lng}-${index}`}
          icon={icon}
          position={[point.lat, point.lng]}
          eventHandlers={{
            click: () => handleClick(point),
          }}
        />
      );
    });
  }, [mergedPoints, handleClick]);

  return (
    <>
      <MapLeaflet
        markers={markers}
        initialCenter={initialCenter}
        currentLocation={currentLocation}
        isLocationLoading={isLocationLoading}
        mapTypePic={mapTypePic}
      />
      <Header />
      <MapTypeButton handleMapType={handleMapType} mapTypePic={mapTypePic} />
      <LocationSheet selectedPoint={selectedPoint as MergedPoint} />
      <LocationDetailSheet
        item={selectedPoint?.items[0] ?? null}
        destination={selectedPoint ? { lat: selectedPoint.lat, lng: selectedPoint.lng } : null}
        queryKey="point"
      />
      <Attribution mapTypePic={mapTypePic} />
    </>
  );
}
