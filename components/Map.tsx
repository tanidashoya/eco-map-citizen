"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import LocateButton from "./locate-button";
import { convertDriveUrl } from "@/lib/utils/convert-drive-url";

// Next.js環境でのアイコン修正
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as Record<string, any>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Point = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
};

type MapProps = {
  points: Point[];
};

export default function Map({ points }: MapProps) {
  const defaultCenter: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [34.78, 132.86]; // 広島付近（データに合わせて調整）

  return (
    <MapContainer
      center={defaultCenter}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION}
        url={process.env.NEXT_PUBLIC_MAP_URL ?? ""}
        className="map-minimal"
      />
      {points.map((point, index) => (
        <Marker key={`${point.id}-${index}`} position={[point.lat, point.lng]}>
          <Popup>
            <div style={{ maxWidth: 200 }}>
              <strong>{point.title}</strong>
              {point.shootingDate && (
                <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>
                  {point.shootingDate}
                </p>
              )}
              {point.comment && (
                <p style={{ margin: "4px 0" }}>{point.comment}</p>
              )}
              {point.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={convertDriveUrl(point.imageUrl)}
                  alt={point.title}
                  // referrerPolicy="no-referrer"
                  style={{ width: "100%", marginTop: 8 }}
                />
              )}
            </div>
          </Popup>
        </Marker>
      ))}
      <LocateButton />
    </MapContainer>
  );
}
