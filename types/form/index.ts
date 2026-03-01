export interface FormValues {
  name: string;
  address: string;
  birthdate: string;
  comment: string;
}

export interface PreviewImage {
  /** ブラウザ上でのプレビュー用 ObjectURL */
  previewUrl: string;
  /** 実際に送信する File オブジェクト */
  file: File;
}

export interface ImageUploaderProps {
  image: PreviewImage | null;
  disabled?: boolean;
  onImageChange: (image: PreviewImage | null) => void;
}

// ========== カメラ撮影 + 位置情報取得用 ==========

/** 位置情報（緯度・経度） */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/** カメラで撮影した画像 + 位置情報 + 撮影時間 */
export interface CapturedImage {
  /** ブラウザ上でのプレビュー用 ObjectURL */
  previewUrl: string;
  /** 実際に送信する File オブジェクト */
  file: File;
  /** 撮影時の位置情報（Geolocation APIで取得） */
  location: GeoLocation | null;
  /** 撮影時刻（ISO 8601形式） */
  capturedAt: string;
}

/** CameraCaptureコンポーネントのprops */
export interface CameraCaptureProps {
  /** 撮影済みの画像データ */
  capturedImage: CapturedImage | null;
  /** 無効化フラグ（送信中など） */
  disabled?: boolean;
  /** 画像・位置情報が変更されたときのコールバック */
  onCapture: (data: CapturedImage | null) => void;
}

// 位置情報のステータス型
export type LocationStatus = "loading" | "ready" | "denied" | "error";

export interface LocationStatusBadgeProps {
  status: LocationStatus;
}
