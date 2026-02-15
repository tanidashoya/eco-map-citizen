"use client";
import { useMap } from "react-leaflet";
import { useState } from "react";
import { Locate } from "lucide-react";
import { Button } from "@/components/ui/button";

// 現在地フォーカスボタン
export default function LocateButton() {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("お使いのブラウザは位置情報に対応していません");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.flyTo([latitude, longitude], 15);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("位置情報の使用が許可されていません");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("現在地を取得できませんでした");
            break;
          case error.TIMEOUT:
            alert("位置情報の取得がタイムアウトしました");
            break;
          default:
            alert("現在地を取得できませんでした");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <Button
      onClick={handleLocate}
      // disabled={isLoading}
      className={`absolute z-999 lg:bottom-8 bottom-20 right-6 flex items-center gap-2 justify-center bg-blue-500 text-white hover:bg-blue-600 cursor-pointer`}
    >
      <Locate className="w-4 h-4" />
      <span>現在地</span>
    </Button>
  );
}
