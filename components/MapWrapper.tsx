"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { ssr: false });

type Point = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl?: string;
  comment?: string;
  shootingDate?: string;
};

export default function MapWrapper({ points }: { points: Point[] }) {
  return <Map points={points} />;
}
