import { MergedPoint } from "@/types/maps";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Calendar, MapPin, MessageCircle, User } from "lucide-react";
import GoogleMapButton from "./google-map-button";

export default function LocationPoint({
  selectedPoint,
}: {
  selectedPoint: MergedPoint | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("point");

  if (!selectedPoint) {
    return null;
  }

  const selectedItem = selectedPoint.items[0];

  const nameformatted = selectedItem.name ? selectedItem.name : "匿名ユーザー";

  const shootingDateformatted = selectedItem.shootingDate
    ? new Date(selectedItem.shootingDate).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "不明";

  const locationformatted = selectedItem.location
    ? selectedItem.location
        .split(" ")
        .reverse()
        .filter((part) => part !== "日本" && !/^\d{3}-?\d{4}$/.test(part))
        .join(" ")
    : "不明";

  const commentformatted = selectedItem.comment
    ? selectedItem.comment
    : "コメントがありません";

  return (
    <>
      <Sheet
        open={itemId === selectedItem.uniqueId}
        onOpenChange={(open) => {
          //モーダルを閉じた時(openがfalseの時)
          if (!open) {
            router.back();
          }
        }}
      >
        <SheetContent
          side="right"
          className="!w-full !max-w-none !h-full lg:!w-[70%] flex flex-col gap-0"
        >
          <div className="overflow-y-auto flex-1 min-h-0">
            <SheetHeader>
              <SheetTitle className="text-lg lg:text-xl">
                投稿の詳細情報
              </SheetTitle>
              <SheetDescription className="sr-only">
                投稿の詳細情報
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:mt-6">
              <Image
                src={selectedItem.imageUrl || ""}
                alt="投稿画像"
                width={500}
                height={500}
                className="lg:w-[33%] lg:h-[33%] w-[90%] h-[90%] object-cover rounded my-4"
              />
              <div className="flex flex-col justify-center gap-8 px-4 lg:px-6 mb-12">
                <div className="flex flex-col justify-center gap-4 lg:gap-2">
                  <div className="flex items-center gap-2 border border-gray-100 bg-green-500 rounded-md w-fit px-4 py-1">
                    <User className="size-6 text-white" />
                    <span className="text-sm lg:text-base font-bold text-white">
                      投稿者
                    </span>
                  </div>
                  <p className="text-base lg:text-base px-4">{nameformatted}</p>
                </div>
                <div className="flex flex-col justify-center gap-4 lg:gap-2">
                  <div className="flex items-center gap-2 border border-gray-100 bg-green-500 rounded-md w-fit px-4 py-1">
                    <Calendar className="size-6 text-white" />
                    <span className="text-sm lg:text-base font-bold text-white">
                      撮影時間
                    </span>
                  </div>
                  <p className="text-base lg:text-base px-4">
                    {shootingDateformatted}
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-4 lg:gap-2">
                  <div className="flex items-center gap-2 border border-gray-100 bg-green-500 rounded-md w-fit px-4 py-1">
                    <MapPin className="size-6 text-white" />
                    <span className="text-sm lg:text-base font-bold text-white">
                      撮影場所
                    </span>
                  </div>
                  <p className="text-base lg:text-base px-4">
                    {locationformatted}
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-4 lg:gap-2">
                  <div className="flex items-center gap-2 border border-gray-100 bg-green-500 rounded-md w-fit px-4 py-1">
                    <MessageCircle className="size-6 text-white" />
                    <span className="text-sm lg:text-base font-bold text-white">
                      コメント
                    </span>
                  </div>
                  <p className="text-base lg:text-base px-4">
                    {commentformatted}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Googleマップ経路ボタン */}
          <div className="p-4 border-t shrink-0 bg-gray-200">
            <GoogleMapButton
              destination={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
