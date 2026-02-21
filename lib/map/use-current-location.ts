//カスタムフック
import { LocationState } from "@/types/maps";
import { useState, useEffect } from "react";

/**
 * JSDocコメント：現在地を取得するカスタムフックの説明
 * 現在地を取得するカスタムフック
 * ここは処理には関係ない説明部分
 * @param watch - trueの場合、位置を継続的に監視する
 * @returns 現在地の座標、エラー、ローディング状態
 */
//このカスタムHooksの返り値はLocationState型のオブジェクト
export function useCurrentLocation(watch: boolean = false): LocationState {
  //現在地の座標、エラー、ローディング状態を管理⇒このカスタムHooksの返り値として返す
  const [state, setState] = useState<LocationState>({
    coords: null,
    error: null,
    isLoading: true,
  });

  //useEffect: 副作用を実行する
  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        coords: null,
        error: "お使いのブラウザは位置情報に対応していません",
        isLoading: false,
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        coords: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
        isLoading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage: string;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "位置情報の使用が許可されていません";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "現在地を取得できませんでした";
          break;
        case error.TIMEOUT:
          errorMessage = "位置情報の取得がタイムアウトしました";
          break;
        default:
          errorMessage = "現在地を取得できませんでした";
      }
      setState({ coords: null, error: errorMessage, isLoading: false });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    if (watch) {
      const watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        options,
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch]);

  return state;
}
