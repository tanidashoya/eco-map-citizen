"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Point } from "@/types/maps";
import { Loader2 } from "lucide-react";
import { mergePoints } from "@/lib/geo/merge.points";
import { useCurrentLocation } from "@/lib/map/use-current-location";

const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapWrapper({
  pointsWithImages,
}: {
  pointsWithImages: Point[];
}) {
  // 現在地を継続監視で取得（一元管理）
  const { coords: currentLocation, isLoading: isLocationLoading } =
    useCurrentLocation(true);

  //マップに表示するデータを座標点ごとにマージ
  const mergedPoints = useMemo(
    () => mergePoints(pointsWithImages),
    [pointsWithImages],
  );

  // マップの初期位置をレンダー時に導出（effect不要）
  const initialCenter = useMemo((): [number, number] | null => {
    if (currentLocation) return [currentLocation.lat, currentLocation.lng];
    if (!isLocationLoading) {
      return mergedPoints.length > 0
        ? [mergedPoints[0].lat, mergedPoints[0].lng]
        : [34.78, 132.86];
    }
    return null;
  }, [currentLocation, isLocationLoading, mergedPoints]);

  if (!initialCenter) {
    return (
      <div className="flex justify-center items-center h-full gap-2">
        <Loader2 className="animate-spin size-12 text-green-500" />
        <p className="text-lg font-medium animate-pulse">
          マップを読み込み中...
        </p>
      </div>
    );
  }

  return (
    <Map
      mergedPoints={mergedPoints}
      initialCenter={initialCenter}
      currentLocation={currentLocation}
    />
  );
}
