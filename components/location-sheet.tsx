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
import GoogleMapButton from "./google-map-button";

export default function LocationSheet({ selectedPoint }: LocationSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const itemId = searchParams.get("item");

  // 詳細Sheetが開いているかどうか
  const isDetailOpen = !!itemId;

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
        <SheetContent
          side="bottom"
          className={`h-[60vh] lg:h-[70vh] flex flex-col items-center transition-all duration-100 gap-0 ${
            isDetailOpen ? "brightness-30 pointer-events-none" : ""
          }`}
        >
          {/* Flexアイテムが"中身の高さに引っ張られて縮まなくなる現象"を解除するもの */}
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
                    destination={{
                      lat: selectedPoint.lat,
                      lng: selectedPoint.lng,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Googleマップ経路ボタン（縮まないように固定） */}
          <div className="shrink-0 p-4 border-t bg-gray-200 w-full flex justify-center">
            <GoogleMapButton
              destination={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
