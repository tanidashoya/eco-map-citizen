"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import Map, {
  MapRef,
  Marker,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { MergedPoint } from "@/types/maps";
import { DEFAULT_ZOOM, FLY_TO_DURATION, FLY_TO_ZOOM, IMMEDIATE_OPEN_ZOOM_THRESHOLD, MAX_CLUSTER_RADIUS } from "@/lib/map/constants";
import Attribution from "./attribution";
import MapTypeButton from "./map-type-button";

// OpenFreeMap のスタイルURL (Googleマップ風の明るいスタイル)
const OPENFREEMAP_STYLE_BRIGHT = "https://tiles.openfreemap.org/styles/bright";

// スタイルを取得してローマ字ラベルを削除する関数
async function fetchAndModifyStyle(url: string): Promise<maplibregl.StyleSpecification> {
  const response = await fetch(url);
  const style = await response.json() as maplibregl.StyleSpecification;

  // ラベルレイヤーのtext-fieldを日本語のみに変更
  if (style.layers) {
    style.layers = style.layers.map((layer) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyLayer = layer as any;

      // text-fieldプロパティを持つレイヤー（ラベル）を処理
      if (anyLayer.layout && anyLayer.layout["text-field"]) {
        // すべてのtext-fieldをnameのみに変更（日本語名のみ表示）
        anyLayer.layout["text-field"] = ["get", "name"];
      }

      return layer;
    });
  }

  return style;
}

// 国土地理院の航空写真用ラスタースタイル
const GSI_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: "raster",
      tiles: ["https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg"],
      tileSize: 256,
      maxzoom: 18, // タイルの最大ネイティブズーム（これ以上はスケーリングで対応）
      attribution: '© <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    },
  },
  layers: [
    {
      id: "gsi-layer",
      type: "raster",
      source: "gsi",
      minzoom: 0,
      maxzoom: 22, // レイヤーの表示可能範囲（ソースのmaxzoom以上でもスケーリング表示される）
    },
  ],
};

// Supercluster用のポイントデータ型
interface ClusterPointProperties {
  cluster: false;
  mergedPointIndex: number;
  itemCount: number;
  imageUrl: string;
}

interface ClusterProperties {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: number;
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, ClusterPointProperties>;

interface MapMaplibreProps {
  mergedPoints: MergedPoint[];
  initialCenter: [number, number];
  currentLocation: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
  onMarkerClick: (point: MergedPoint, shouldZoom: boolean) => void;
}

export default function MapMaplibre({
  mergedPoints,
  initialCenter,
  currentLocation,
  isLocationLoading,
  onMarkerClick,
}: MapMaplibreProps) {
  const mapRef = useRef<MapRef>(null);
  const [mapTypePic, setMapTypePic] = useState(true); // true = 地図（Bright）, false = 航空写真
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
  const [brightStyle, setBrightStyle] = useState<maplibregl.StyleSpecification | null>(null);

  // OpenFreeMapスタイルを取得してローマ字ラベルを削除
  useEffect(() => {
    fetchAndModifyStyle(OPENFREEMAP_STYLE_BRIGHT)
      .then(setBrightStyle)
      .catch((err) => {
        console.error("Failed to fetch map style:", err);
      });
  }, []);

  // Superclusterインスタンスの作成
  const supercluster = useMemo(() => {
    const cluster = new Supercluster<ClusterPointProperties, ClusterProperties>({
      radius: MAX_CLUSTER_RADIUS, // クラスタリング半径（ピクセル）
      maxZoom: 16, // このズームレベル以上ではクラスタリングしない（17, 18, 19では個別表示）
      minZoom: 0,
    });

    // MergedPointsをGeoJSONポイントに変換
    const points: PointFeature[] = mergedPoints.map((point, index) => ({
      type: "Feature",
      properties: {
        cluster: false as const,
        mergedPointIndex: index,
        itemCount: point.items.length,
        imageUrl: point.items[0]?.imageUrl ?? "/placeholder.svg",
      },
      geometry: {
        type: "Point",
        coordinates: [point.lng, point.lat],
      },
    }));

    cluster.load(points);
    return cluster;
  }, [mergedPoints]);

  // 表示するクラスター/マーカーを計算
  const clusters = useMemo(() => {
    if (!bounds) return [];
    return supercluster.getClusters(bounds, Math.floor(zoom));
  }, [supercluster, bounds, zoom]);

  // マップタイプの切り替え
  const handleMapType = useCallback(() => {
    setMapTypePic((prev) => !prev);
  }, []);

  // マップ移動時のハンドラ
  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const mapBounds = map.getBounds();
    setBounds([
      mapBounds.getWest(),
      mapBounds.getSouth(),
      mapBounds.getEast(),
      mapBounds.getNorth(),
    ]);
    setZoom(map.getZoom());
  }, []);

  // クラスターのクリックハンドラ
  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        20
      );

      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: FLY_TO_DURATION * 1000,
      });
    },
    [supercluster]
  );

  // 個別マーカーのクリックハンドラ
  const handleMarkerClick = useCallback(
    (pointIndex: number, lng: number, lat: number) => {
      const point = mergedPoints[pointIndex];
      if (!point) return;

      const currentZoom = mapRef.current?.getZoom() ?? 0;
      const shouldZoom = currentZoom < IMMEDIATE_OPEN_ZOOM_THRESHOLD;

      if (shouldZoom) {
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: FLY_TO_ZOOM,
          duration: FLY_TO_DURATION * 1000,
        });
        // ズーム完了後にシートを開く
        setTimeout(() => {
          onMarkerClick(point, false);
        }, FLY_TO_DURATION * 1000);
      } else {
        onMarkerClick(point, false);
      }
    },
    [mergedPoints, onMarkerClick]
  );

  // 初期表示時にboundsを設定
  useEffect(() => {
    // 少し遅延を入れてマップが完全にロードされてから
    const timer = setTimeout(() => {
      handleMoveEnd();
    }, 100);
    return () => clearTimeout(timer);
  }, [handleMoveEnd]);

  // マップスタイル
  // ローマ字なしのスタイルを使用（ロード中は元のURLを使用）
  const mapStyle = mapTypePic
    ? (brightStyle ?? OPENFREEMAP_STYLE_BRIGHT)
    : GSI_RASTER_STYLE;

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: initialCenter[1],
          latitude: initialCenter[0],
          zoom: DEFAULT_ZOOM,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle}
        onMoveEnd={handleMoveEnd}
        onLoad={handleMoveEnd}
        maxZoom={19}
        attributionControl={false}
      >
        {/* クラスター/マーカーの描画 */}
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const properties = feature.properties;

          // クラスターの場合
          if ("cluster" in properties && properties.cluster) {
            const { cluster_id, point_count } = properties;

            // クラスター内の全アイテム数を計算
            let totalItemCount = 0;
            let firstImageUrl = "/placeholder.svg";
            try {
              const leaves = supercluster.getLeaves(cluster_id, Infinity) as PointFeature[];
              leaves.forEach((leaf, index) => {
                totalItemCount += leaf.properties.itemCount;
                if (index === 0) {
                  firstImageUrl = leaf.properties.imageUrl;
                }
              });
            } catch {
              totalItemCount = point_count;
            }

            return (
              <Marker
                key={`cluster-${cluster_id}`}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleClusterClick(cluster_id, lng, lat);
                }}
              >
                <div className="cursor-pointer">
                  <MarkerIcon
                    imageUrl={firstImageUrl}
                    count={totalItemCount}
                  />
                </div>
              </Marker>
            );
          }

          // 個別マーカーの場合
          const { mergedPointIndex, itemCount, imageUrl } = properties as ClusterPointProperties;

          return (
            <Marker
              key={`marker-${mergedPointIndex}`}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(mergedPointIndex, lng, lat);
              }}
            >
              <div className="cursor-pointer">
                <MarkerIcon
                  imageUrl={imageUrl}
                  count={itemCount}
                />
              </div>
            </Marker>
          );
        })}

        {/* 現在地マーカー */}
        {currentLocation && (
          <Marker
            longitude={currentLocation.lng}
            latitude={currentLocation.lat}
            anchor="center"
          >
            <div className="current-location-marker">
              <div className="current-location-pulse" />
              <div className="current-location-dot" />
            </div>
          </Marker>
        )}
      </Map>

      {/* UIコントロール */}
      <div className="absolute bottom-14 right-4 z-[999] flex flex-col items-end gap-2 lg:bottom-8 lg:right-6">
        <MapTypeButton handleMapType={handleMapType} mapTypePic={mapTypePic} />
        <LocateButtonMaplibre
          mapRef={mapRef}
          coords={currentLocation}
          isLocationLoading={isLocationLoading}
        />
      </div>

      <Attribution mapTypePic={mapTypePic} />
    </div>
  );
}

// マーカーアイコンコンポーネント
function MarkerIcon({
  imageUrl,
  count,
}: {
  imageUrl: string;
  count: number;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayUrl = imgError ? "/placeholder.svg" : imageUrl;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" }}
    >
      {/* バッジ */}
      {count > 1 && (
        <div
          className="absolute -top-1.5 -right-1.5 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-green-500 text-xs font-bold text-white"
        >
          {count}
        </div>
      )}

      {/* 画像 */}
      <div className="relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[20%] border-[3px] border-white bg-gray-200">
        {/* ローディングスピナー */}
        {!imgLoaded && (
          <div className="marker-spinner absolute h-5 w-5 rounded-full border-2 border-gray-200 border-t-green-500" />
        )}
        <img
          src={displayUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: "opacity 0.2s",
          }}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
        />
      </div>

      {/* 三角ピン */}
      <div
        className="-mt-px h-0 w-0"
        style={{
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "12px solid white",
        }}
      />
    </div>
  );
}

// MapLibre用の現在地ボタン
function LocateButtonMaplibre({
  mapRef,
  coords,
  isLocationLoading,
}: {
  mapRef: React.RefObject<MapRef | null>;
  coords: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
}) {
  const handleClick = useCallback(() => {
    if (!coords || !mapRef.current) return;

    mapRef.current.flyTo({
      center: [coords.lng, coords.lat],
      zoom: DEFAULT_ZOOM,
      duration: 1000,
    });
  }, [coords, mapRef]);

  return (
    <button
      onClick={handleClick}
      disabled={isLocationLoading || !coords}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:bg-gray-100 disabled:opacity-50"
      aria-label="現在地に移動"
    >
      {isLocationLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      ) : (
        <svg
          className="h-5 w-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
}
