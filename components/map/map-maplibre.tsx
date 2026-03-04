"use client";

import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import Map, { MapRef, Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Supercluster from "supercluster";
import { MergedPoint } from "@/types/maps";
import {
  DEFAULT_ZOOM,
  FLY_TO_DURATION,
  MAX_CLUSTER_RADIUS,
} from "@/lib/map/constants";
import {
  OPENFREEMAP_STYLE_BRIGHT,
  GSI_RASTER_STYLE,
  fetchAndModifyStyle,
} from "@/lib/map/styles";
import Attribution from "./attribution";
import MapTypeButton from "./map-type-button";
import MarkerIcon from "./marker-icon";
import LocateButton from "./locate-button";
import CategoryFilter, { CategoryFilterValue } from "./category-filter";

// Supercluster用の型定義
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
  const [mapTypePic, setMapTypePic] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null,
  );
  const [brightStyle, setBrightStyle] =
    useState<maplibregl.StyleSpecification | null>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");

  // カテゴリでフィルタリングされたmergedPoints
  const filteredMergedPoints = useMemo(() => {
    if (categoryFilter === "all") {
      return mergedPoints;
    }

    return mergedPoints
      .map((point) => ({
        ...point,
        items: point.items.filter((item) => item.category === categoryFilter),
      }))
      .filter((point) => point.items.length > 0);
  }, [mergedPoints, categoryFilter]);

  // OpenFreeMapスタイルを取得してローマ字ラベルを削除
  useEffect(() => {
    fetchAndModifyStyle(OPENFREEMAP_STYLE_BRIGHT)
      .then(setBrightStyle)
      .catch((err) => {
        console.error("Failed to fetch map style:", err);
      });
  }, []);

  // Superclusterインスタンスの作成（フィルタリング済みデータを使用）
  const supercluster = useMemo(() => {
    const cluster = new Supercluster<ClusterPointProperties, ClusterProperties>(
      {
        radius: MAX_CLUSTER_RADIUS,
        maxZoom: 16,
        minZoom: 0,
      },
    );

    const points: PointFeature[] = filteredMergedPoints.map((point, index) => ({
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
  }, [filteredMergedPoints]);

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

  // マップロード時のハンドラ（回転を無効化）
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
    }
    handleMoveEnd();
  }, [handleMoveEnd]);

  // クラスターのクリックハンドラ
  const handleClusterClick = useCallback(
    (clusterId: number, lng: number, lat: number) => {
      const expansionZoom = Math.min(
        supercluster.getClusterExpansionZoom(clusterId),
        20,
      );

      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: expansionZoom,
        duration: FLY_TO_DURATION * 1000,
      });
    },
    [supercluster],
  );

  // 個別マーカーのクリックハンドラ（フィルタリング済みデータを使用）
  const handleMarkerClick = useCallback(
    (pointIndex: number) => {
      const point = filteredMergedPoints[pointIndex];
      if (!point) return;
      onMarkerClick(point, false);
    },
    [filteredMergedPoints, onMarkerClick],
  );

  // 初期表示時にboundsを設定
  useEffect(() => {
    const timer = setTimeout(() => {
      handleMoveEnd();
    }, 100);
    return () => clearTimeout(timer);
  }, [handleMoveEnd]);

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
        onLoad={handleLoad}
        maxZoom={19}
        attributionControl={false}
        pitchWithRotate={false}
        touchPitch={false}
      >
        {/* クラスター/マーカーの描画 */}
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          const properties = feature.properties;

          // クラスターの場合
          if ("cluster" in properties && properties.cluster) {
            const { cluster_id, point_count } = properties;

            let totalItemCount = 0;
            let firstImageUrl = "/placeholder.svg";
            try {
              const leaves = supercluster.getLeaves(
                cluster_id,
                Infinity,
              ) as PointFeature[];
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
                    isCluster={true}
                  />
                </div>
              </Marker>
            );
          }

          // 個別マーカーの場合
          const { mergedPointIndex, itemCount, imageUrl } =
            properties as ClusterPointProperties;

          return (
            <Marker
              key={`marker-${mergedPointIndex}`}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(mergedPointIndex);
              }}
            >
              <div className="cursor-pointer">
                <MarkerIcon imageUrl={imageUrl} count={itemCount} />
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

      {/* カテゴリフィルター */}
      <div className="absolute top-20 left-4 z-[999] lg:top-24 lg:left-6">
        <CategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
      </div>

      {/* UIコントロール */}
      <div className="absolute bottom-14 right-4 z-[999] flex flex-col items-end gap-2 lg:bottom-8 lg:right-6">
        <LocateButton
          mapRef={mapRef}
          coords={currentLocation}
          isLocationLoading={isLocationLoading}
        />
        <MapTypeButton handleMapType={handleMapType} mapTypePic={mapTypePic} />
      </div>

      <Attribution mapTypePic={mapTypePic} />
    </div>
  );
}
