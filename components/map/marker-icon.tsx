"use client";

import { useState } from "react";

interface MarkerIconProps {
  imageUrl: string;
  count: number;
  isCluster?: boolean;
}

export default function MarkerIcon({
  imageUrl,
  count,
  isCluster = false,
}: MarkerIconProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const displayUrl = imgError ? "/placeholder.svg" : imageUrl;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))" }}
    >
      {/* バッジ - クラスターと個別マーカーで異なるデザイン */}
      {count > 1 &&
        (isCluster ? (
          // クラスター用バッジ: 青色、大きめ、角丸小さめ
          <div className="absolute -top-2 -right-2 z-10 flex h-[26px] min-w-[26px] items-center justify-center rounded-md border-2 border-white bg-blue-500 px-1 text-xs font-bold text-white shadow-md">
            {count}
          </div>
        ) : (
          // 個別マーカー用バッジ: 緑色、丸型
          <div className="absolute -top-1.5 -right-1.5 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-white bg-green-500 text-xs font-bold text-white">
            {count}
          </div>
        ))}

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
