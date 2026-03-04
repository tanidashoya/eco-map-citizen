"use client";

import { useCallback } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import { DEFAULT_ZOOM } from "@/lib/map/constants";

interface LocateButtonProps {
  mapRef: React.RefObject<MapRef | null>;
  coords: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
}

export default function LocateButton({
  mapRef,
  coords,
  isLocationLoading,
}: LocateButtonProps) {
  const handleClick = useCallback(() => {
    if (!coords || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: DEFAULT_ZOOM,
      duration: 1000,
    });
  }, [coords, mapRef]);

  return (
    <button
      onClick={handleClick}
      disabled={isLocationLoading || !coords}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-100 disabled:opacity-50"
      aria-label="現在地に移動"
    >
      {isLocationLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : (
        <svg
          className="h-5 w-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
}
