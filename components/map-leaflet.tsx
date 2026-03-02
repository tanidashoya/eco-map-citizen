"use client";
import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import CurrentLocationMarker from "./current-location-marker";
import LocateButton from "./locate-button";
import Attribution from "./attribution";
import MapTypeButton from "./map-type-button";
import {
  DEFAULT_ZOOM,
  FLY_TO_DURATION,
  MAX_CLUSTER_RADIUS,
} from "@/lib/map/constants";

// マップ参照を外部に渡すコンポーネント
function MapRefSetter({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

interface MapLeafletProps {
  initialCenter: [number, number];
  currentLocation: { lat: number; lng: number } | null;
  isLocationLoading: boolean;
  markers: React.ReactNode;
  mapTypePic: boolean;
  handleMapType: () => void;
}

export default function MapLeaflet({
  markers,
  initialCenter,
  currentLocation,
  isLocationLoading,
  mapTypePic,
  handleMapType,
}: MapLeafletProps) {
  const mapAttribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION;
  const mapUrl = process.env.NEXT_PUBLIC_MAP_URL;
  const mapAttributionPic = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION_PIC;
  const mapUrlPic = process.env.NEXT_PUBLIC_MAP_URL_PIC;

  // マップインスタンスへの参照
  const mapRef = useRef<L.Map | null>(null);

  // クラスタークリック時のハンドラ
  const handleClusterClick = (e: L.LeafletMouseEvent) => {
    const cluster = e.propagatedFrom as L.MarkerCluster;
    if (mapRef.current && cluster && typeof cluster.getBounds === "function") {
      mapRef.current.flyToBounds(cluster.getBounds(), {
        duration: FLY_TO_DURATION,
        padding: [50, 50],
      });
    }
  };

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      maxZoom={19}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
      zoomControl={false}
    >
      <MapRefSetter mapRef={mapRef} />
      {mapTypePic ? (
        <TileLayer
          attribution={mapAttributionPic}
          url={mapUrlPic ?? ""}
          className="map-minimal"
          maxNativeZoom={18}
          maxZoom={19}
        />
      ) : (
        <TileLayer
          attribution={mapAttribution}
          url={mapUrl ?? ""}
          className="map-minimal"
          maxNativeZoom={18}
          maxZoom={19}
        />
      )}
      <MarkerClusterGroup
        maxClusterRadius={MAX_CLUSTER_RADIUS}
        animate={true}
        animateAddingMarkers={false}
        spiderfyOnMaxZoom={false}
        zoomToBoundsOnClick={false}
        showCoverageOnHover={false}
        onClick={handleClusterClick}
        iconCreateFunction={(cluster: L.MarkerCluster) => {
          // 各地点のアイテム数を合計
          const childMarkers = cluster.getAllChildMarkers();
          let totalItems = 0;
          let imageUrl = "/placeholder.svg";

          childMarkers.forEach((marker, index) => {
            const icon = marker.getIcon();
            if (icon && icon.options && "html" in icon.options) {
              const html = icon.options.html as string;

              // 最初のマーカーから画像URLを取得
              if (index === 0) {
                const srcMatch = html.match(/src="([^"]+)"/);
                if (srcMatch && srcMatch[1]) {
                  imageUrl = srcMatch[1];
                }
              }

              // バッジの数字を抽出（バッジがない場合は1）
              const countMatch = html.match(/<div[^>]*style="[^"]*position:absolute[^"]*top:-6px[^"]*"[^>]*>\s*(\d+)\s*<\/div>/);
              if (countMatch && countMatch[1]) {
                totalItems += parseInt(countMatch[1], 10);
              } else {
                totalItems += 1; // バッジがない = アイテム1個
              }
            } else {
              totalItems += 1;
            }
          });

          const count = totalItems;

          return L.divIcon({
            html: `
              <div style="position:relative;display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 4px rgba(0,0,0,0.35));">
                <!-- バッジ -->
                <div style="
                  position:absolute;
                  top:-6px;
                  right:-6px;
                  background:#22c55e;
                  color:white;
                  font-size:12px;
                  font-weight:bold;
                  width:22px;
                  height:22px;
                  border-radius:9999px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  border:2px solid white;
                  z-index:10;
                ">
                  ${count}
                </div>
                <!-- 画像 -->
                <div style="
                  width:54px;
                  height:54px;
                  border-radius:20%;
                  overflow:hidden;
                  border:3px solid white;
                  background:#e5e7eb;
                ">
                  <img
                    src="${imageUrl}"
                    onerror="this.src='/placeholder.svg'"
                    style="width:100%;height:100%;object-fit:cover;display:block;"
                  />
                </div>
                <!-- 三角ピン -->
                <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:12px solid white;margin-top:-1px;"></div>
              </div>
            `,
            className: "",
            iconSize: [60, 69],
            iconAnchor: [30, 69],
          });
        }}
      >
        {markers}
      </MarkerClusterGroup>
      <CurrentLocationMarker coords={currentLocation} />

      {/* 右下ボタン群 - flexboxで縦に並べて右端揃えにした */}
      <div className="absolute bottom-14 right-4 z-999 flex flex-col items-end gap-2 lg:bottom-8 lg:right-6">
        <MapTypeButton handleMapType={handleMapType} mapTypePic={mapTypePic} />
        <LocateButton
          coords={currentLocation}
          isLocationLoading={isLocationLoading}
        />
      </div>

      <Attribution mapTypePic={mapTypePic} />
    </MapContainer>
  );
}
