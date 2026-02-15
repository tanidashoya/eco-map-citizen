"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Point } from "@/types/maps";
import { Loader2 } from "lucide-react";

const Map = dynamic(() => import("./Map"), { ssr: false });

export default function MapWrapper({
  pointsWithImages,
}: {
  pointsWithImages: Point[];
}) {
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(
    null,
  );

  useEffect(() => {
    const startTime = Date.now();

    const defaultCenter: [number, number] =
      pointsWithImages.length > 0
        ? [pointsWithImages[0].lat, pointsWithImages[0].lng]
        : [34.78, 132.86];

    const finish = (center: [number, number]) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(() => {
        setInitialCenter(center);
      }, remaining);
    };

    if (!navigator.geolocation) {
      finish(defaultCenter);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finish([pos.coords.latitude, pos.coords.longitude]);
      },
      () => {
        finish(defaultCenter);
      },
      { timeout: 5000 },
    );
  }, [pointsWithImages]);

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

  return <Map pointsWithImages={pointsWithImages} />;
}
