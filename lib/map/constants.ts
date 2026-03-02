// マップ関連の共通定数

// ズームしきい値 - この値以上のズームレベルではすぐにシートを開く
// maxClusterRadius={10}と整合性を考慮
// zoom 17以上ではほとんどのマーカーがクラスター化しない
export const IMMEDIATE_OPEN_ZOOM_THRESHOLD = 17;

// flyToアニメーションの設定
export const FLY_TO_ZOOM = 19;
export const FLY_TO_DURATION = 1; // 秒

// デフォルトズームレベル
export const DEFAULT_ZOOM = 16;

// クラスターの設定
export const MAX_CLUSTER_RADIUS = 10; // ピクセル
