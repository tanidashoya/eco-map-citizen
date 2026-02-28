import { toast } from "sonner";
import { GeoLocation } from "@/types/form";

export const getLocationLib = (
  setIsGettingLocation: (isGettingLocation: boolean) => void,
): Promise<GeoLocation | null> => {
  // Geolocation APIのオプション
  const GEO_OPTIONS: PositionOptions = {
    enableHighAccuracy: true, // 高精度モード（GPS優先）
    timeout: 10000, // 10秒でタイムアウト
    maximumAge: 0, // キャッシュを使わず常に最新の位置を取得
  };

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      toast.error("お使いのブラウザは位置情報に対応していません");
      resolve(null);
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: GeoLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setIsGettingLocation(false);
        resolve(location);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("位置情報の許可が必要です。設定から許可してください。");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("位置情報を取得できませんでした");
            break;
          case error.TIMEOUT:
            toast.error("位置情報の取得がタイムアウトしました");
            break;
        }
        resolve(null);
      },
      GEO_OPTIONS,
    );
  });
};
