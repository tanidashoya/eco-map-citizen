"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

type CurrentLocationMarkerProps = {
  coords: { lat: number; lng: number } | null;
};

/**
 * 現在地を青い丸で表示するマーカーコンポーネント
 * 親コンポーネントから座標を受け取り表示する
 */
export default function CurrentLocationMarker({
  coords,
}: CurrentLocationMarkerProps) {
  const currentLocationIcon = useMemo(
    () =>
      L.divIcon({
        className: "current-location-icon",
        html: `
          <div class="current-location-marker">
            <div class="current-location-pulse"></div>
            <div class="current-location-dot"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    []
  );

  if (!coords) return null;

  return (
    <Marker
      position={[coords.lat, coords.lng]}
      icon={currentLocationIcon}
      zIndexOffset={1000}
    />
  );
}
