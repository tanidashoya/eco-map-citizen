"use client";
import { useMap } from "react-leaflet";
import { Loader2, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

// 現在地フォーカスボタン
export default function LocateButton() {
  const map = useMap();
  const DEFAULT_ZOOM = 13;
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("お使いのブラウザは位置情報に対応していません");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], DEFAULT_ZOOM);
        setIsLocating(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("位置情報の使用が許可されていません");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("現在地を取得できませんでした");
            break;
          case error.TIMEOUT:
            toast.error("位置情報の取得がタイムアウトしました");
            break;
          default:
            toast.error("現在地を取得できませんでした");
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="absolute z-999 lg:bottom-8 bottom-20 right-6">
      <Button
        onClick={handleLocate}
        disabled={isLocating}
        className="flex w-24 items-center gap-2 px-4 py-5 justify-center bg-blue-500 shadow-md text-white hover:bg-blue-600 cursor-pointer"
      >
        {isLocating ? (
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
