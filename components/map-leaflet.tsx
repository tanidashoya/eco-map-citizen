"use client";
import { MapContainer, TileLayer } from "react-leaflet";
import CurrentLocationMarker from "./current-location-marker";
import LocateButton from "./locate-button";
import Attribution from "./attribution";
import MapTypeButton from "./map-type-button";

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
  const DEFAULT_ZOOM = 16;

  return (
    <MapContainer
      center={initialCenter}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
      zoomControl={false}
    >
      {mapTypePic ? (
        <TileLayer
          attribution={mapAttributionPic}
          url={mapUrlPic ?? ""}
          className="map-minimal"
        />
      ) : (
        <TileLayer
          attribution={mapAttribution}
          url={mapUrl ?? ""}
          className="map-minimal"
        />
      )}
      {markers}
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
