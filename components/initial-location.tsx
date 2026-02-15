// components/initial-location.tsx
"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

const DEFAULT_ZOOM = 13;

export default function InitialLocation() {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], DEFAULT_ZOOM);
      },
      () => {
        // 取得失敗時はデフォルト位置のまま
      },
    );
  }, [map]);

  return null;
}
