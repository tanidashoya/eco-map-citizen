import React from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { ClusterItem, MergedPoint } from "@/types/maps";
import { useRouter, useSearchParams } from "next/navigation";

interface LocationSheetProps {
  selectedPoint: MergedPoint;
}
export default function LocationSheet({ selectedPoint }: LocationSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get("location");
  return (
    <Sheet
      open={!!locationId}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/");
        }
      }}
    >
      <SheetContent side="left" className="w-[80vw]">
        {selectedPoint && (
          <div className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{selectedPoint.items.length}件の投稿</SheetTitle>
              <SheetDescription className="sr-only">
                選択した地点の投稿一覧
              </SheetDescription>
            </SheetHeader>

            {selectedPoint.items.map((item: ClusterItem, idx: number) => (
              <div
                key={idx}
                className="mb-4 border-b pb-2 flex flex-col items-center justify-between"
              >
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
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
