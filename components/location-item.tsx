import React from "react";
import Image from "next/image";
import { ClusterItem } from "@/types/maps";

export default function LocationItem({ item }: { item: ClusterItem }) {
  const name = item.name || "匿名ユーザー";
  return (
    <div className="relative">
      {item.imageUrl && (
        <Image
          src={item.imageUrl}
          alt="投稿画像"
          width={96}
          height={96}
          className="w-24 h-24 object-cover rounded mt-2"
        />
      )}
      <div className="absolute bottom-1 left-1 w-full">
        <p className="text-white text-xs truncate">{name}</p>
      </div>
    </div>
  );
}
