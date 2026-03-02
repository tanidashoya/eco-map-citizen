"use client";

import { useState, useCallback } from "react";
import { MapProps, MergedPoint } from "@/types/maps";
import Header from "./header";
import LocationSheet from "./location-sheet";
import { useRouter } from "next/navigation";
import LocationDetailSheet from "./location-detail-sheet";
import MapMaplibre from "./map-maplibre";

export default function Map({
  mergedPoints,
  initialCenter,
  currentLocation,
  isLocationLoading,
}: MapProps) {
  const [selectedPoint, setSelectedPoint] = useState<MergedPoint | null>(null);
  const router = useRouter();

  // マーカークリック時のハンドラ
  const handleMarkerClick = useCallback(
    (point: MergedPoint) => {
      setSelectedPoint(point);
      if (point.items.length === 1) {
        router.push(`/?point=${point.items[0].uniqueId}`);
      } else {
        router.push(`/?cluster=${point.lat}-${point.lng}`);
      }
    },
    [router]
  );

  return (
    <>
      <MapMaplibre
        mergedPoints={mergedPoints}
        initialCenter={initialCenter}
        currentLocation={currentLocation}
        isLocationLoading={isLocationLoading}
        onMarkerClick={handleMarkerClick}
      />
      <Header />

      <LocationSheet selectedPoint={selectedPoint as MergedPoint} />
      <LocationDetailSheet
        item={selectedPoint?.items[0] ?? null}
        destination={
          selectedPoint
            ? { lat: selectedPoint.lat, lng: selectedPoint.lng }
            : null
        }
        queryKey="point"
      />
    </>
  );
}
