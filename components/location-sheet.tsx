"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { ClusterItem, LocationSheetProps } from "@/types/maps";
import { useRouter, useSearchParams } from "next/navigation";
import LocationItem from "./location-item";

export default function LocationSheet({ selectedPoint }: LocationSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterId = searchParams.get("cluster");

  // selectedPointがnullの場合は何も表示しない
  if (!selectedPoint) {
    return null;
  }
  return (
    <>
      <Sheet
        open={!!clusterId}
        onOpenChange={(open) => {
          //モーダルを閉じた時(openがfalseの時)
          if (!open) {
            router.replace("/"); //ここではback()ではなくreplace()を使用している(アプリの外に飛んでいく可能性を防ぐため)
          }
        }}
      >
        <SheetContent side="bottom" className="h-[60vh] flex flex-col">
          {/* Flexアイテムが“中身の高さに引っ張られて縮まなくなる現象”を解除するもの */}
          <div className="overflow-y-auto flex-1 min-h-0">
            <SheetHeader>
              <SheetTitle className="text-lg lg:text-xl">
                {selectedPoint.items.length}件の投稿
              </SheetTitle>
              <SheetDescription className="sr-only">
                選択した地点の投稿一覧
              </SheetDescription>
            </SheetHeader>
            <div className="flex items-center justify-center lg:mt-6">
              <div className="grid grid-cols-3 lg:grid-cols-8 items-center gap-3 md:gap-4 lg:gap-6 justify-center px-2 md:px-4 lg:px-4">
                {selectedPoint.items.map((item: ClusterItem, index: number) => (
                  <LocationItem
                    key={`${item.uniqueId}-${index}`}
                    item={item}
                    clusterId={clusterId}
                  />
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
