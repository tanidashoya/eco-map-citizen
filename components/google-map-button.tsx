import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapButtonProps {
  destination: {
    lat: number;
    lng: number;
  } | null;
}

/**
 * Googleマップの経路検索ページを新規タブで開くボタン
 * 現在地から目的地への経路画面が表示される（APIキー不要）
 */
export default function GoogleMapButton({ destination }: GoogleMapButtonProps) {
  // lat/lngがnullまたは無効な場合は非表示
  if (!destination || isNaN(destination.lat) || isNaN(destination.lng)) {
    return null;
  }

  const googleMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;

  return (
    <a
      href={googleMapUrl}
      // target="_blank"
      // rel="noopener noreferrer"
      className="inline-block w-full lg:w-[40%]"
    >
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-green-500 text-white hover:opacity-80 hover:bg-green-500 hover:text-white cursor-pointer transition-all duration-300"
      >
        <MapPin className="w-4 h-4 lg:w-6 lg:h-6" />
        <span className="text-base lg:text-lg font-medium">
          Googleマップで経路を見る
        </span>
      </Button>
    </a>
  );
}
