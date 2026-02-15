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
import LocationItem from "./location-item";

interface LocationSheetProps {
  selectedPoint: MergedPoint | null;
}
export default function LocationSheet({ selectedPoint }: LocationSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locationId = searchParams.get("location");

  // selectedPointがnullの場合は何も表示しない
  if (!selectedPoint) {
    return null;
  }

  return (
    <Sheet
      open={!!locationId}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/");
        }
      }}
    >
      <SheetContent side="bottom" className="h-[70vh]">
        <div className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedPoint.items.length}件の投稿</SheetTitle>
            <SheetDescription className="sr-only">
              選択した地点の投稿一覧
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-4">
            {selectedPoint.items.map((item: ClusterItem, idx: number) => (
              <LocationItem item={item} key={`${item.shootingDate}-${idx}`} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
