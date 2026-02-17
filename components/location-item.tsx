import React from "react";
import Image from "next/image";
import { ClusterItem } from "@/types/maps";
import { useRouter } from "next/navigation";

interface LocationItemProps {
  item: ClusterItem;
}

export default function LocationItem({ item }: LocationItemProps) {
  const name = item.name || "匿名ユーザー";
  const router = useRouter();
  const handleClick = (point: ClusterItem) => {
    router.push(`/?point=${point.uniqueId}`);
  };
  return (
    <button
      type="button"
      onClick={() => handleClick(item)}
      className="relative cursor-pointer hover:opacity-80 transition-opacity"
    >
      {item.imageUrl && (
        <Image
          src={item.imageUrl}
          alt="投稿画像"
          width={96}
          height={96}
          className="lg:w-36 lg:h-36 w-24 h-24 object-cover rounded mt-2"
        />
      )}
      <div className="absolute bottom-1 left-1 w-full">
        <p className="text-white text-xs lg:text-base truncate">{name}</p>
      </div>
    </button>
  );
}
