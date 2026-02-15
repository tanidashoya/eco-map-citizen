import React from "react";
import Image from "next/image";
import { ClusterItem } from "@/types/maps";

export default function LocationItem({ item }: { item: ClusterItem }) {
  return (
    <div>
      {item.shootingDate && (
        <p className="text-xs text-gray-400">{item.shootingDate}</p>
      )}
      {item.imageUrl && (
        <Image
          src={item.imageUrl}
          alt="投稿画像"
          width={300}
          height={200}
          className="w-[60%] rounded mt-2"
        />
      )}
      {item.comment && <p className="text-sm mt-2">{item.comment}</p>}
    </div>
  );
}
