import type { StyleSpecification } from "maplibre-gl";

// OpenFreeMap のスタイルURL (Googleマップ風の明るいスタイル)
export const OPENFREEMAP_STYLE_BRIGHT =
  "https://tiles.openfreemap.org/styles/bright";

// 国土地理院の航空写真用ラスタースタイル
export const GSI_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: "raster",
      tiles: [
        "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution:
        '© <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    },
  },
  layers: [
    {
      id: "gsi-layer",
      type: "raster",
      source: "gsi",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// スタイルを取得してローマ字ラベルを削除する関数
export async function fetchAndModifyStyle(
  url: string
): Promise<StyleSpecification> {
  const response = await fetch(url);
  const style = (await response.json()) as StyleSpecification;

  // ラベルレイヤーのtext-fieldを日本語のみに変更
  if (style.layers) {
    style.layers = style.layers.map((layer) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyLayer = layer as any;

      // text-fieldプロパティを持つレイヤー（ラベル）を処理
      if (anyLayer.layout && anyLayer.layout["text-field"]) {
        anyLayer.layout["text-field"] = ["get", "name"];
      }

      return layer;
    });
  }

  return style;
}
