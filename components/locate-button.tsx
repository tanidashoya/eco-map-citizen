"use client";
import { useMap } from "react-leaflet";
import { Loader2, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LocateButtonProps = {
  coords: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
};

// 現在地フォーカスボタン
// 親コンポーネントから共有された座標を使用して地図を移動
export default function LocateButton({
  coords,
  isLocationLoading,
}: LocateButtonProps) {
  const map = useMap();
  const DEFAULT_ZOOM = 16;

  const handleLocate = () => {
    if (!coords) {
      toast.error(
        "現在地を取得できませんでした。位置情報を許可してください。",
        {
          id: "location-unavailable-error",
        },
      );
      return;
    }
    map.flyTo([coords.lat, coords.lng], DEFAULT_ZOOM);
  };

  return (
    <div className="absolute z-999 lg:bottom-8 bottom-20 right-6">
      <Button
        onClick={handleLocate}
        disabled={isLocationLoading}
        className="flex w-24 items-center gap-2 px-4 py-5 justify-center bg-blue-500 shadow-md text-white hover:bg-blue-600 cursor-pointer disabled:opacity-50"
      >
        {isLocationLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>取得中</span>
          </>
        ) : (
          <>
            <Locate className="w-4 h-4" />
            <span>現在地</span>
          </>
        )}
      </Button>
    </div>
  );
}
