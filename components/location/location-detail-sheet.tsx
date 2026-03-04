import { ClusterItem } from "@/types/maps";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetSwipeEdge,
} from "@/components/ui/sheet";
import { Calendar, MessageCircle, User } from "lucide-react";
import GoogleMapButton from "./google-map-button";

interface LocationDetailSheetProps {
  /** 表示するアイテム */
  item: ClusterItem | null;
  /** Googleマップ経路用の座標 */
  destination: { lat: number; lng: number } | null;
  /** URLクエリパラメータ名（"point" or "item"） */
  queryKey: "point" | "item";
}

export default function LocationDetailSheet({
  item,
  destination,
  queryKey,
}: LocationDetailSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryValue = searchParams.get(queryKey);

  if (!item || !destination) {
    return null;
  }

  const nameFormatted = item.name ? item.name : "匿名";

  // EXIFから取得した日時は既に日本時間としてフォーマット済み
  const shootingDateFormatted = item.shootingDate || "不明";

  const commentFormatted = item.comment ? item.comment : "コメントがありません";

  return (
    <Sheet
      open={queryValue === item.uniqueId}
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
    >
      <SheetContent
        side="right"
        className="!w-full !max-w-none !h-full lg:!w-[70%] flex flex-col gap-0"
      >
        {/* スワイプエッジ（左端をスワイプで閉じる） */}
        <SheetSwipeEdge onSwipeRight={() => router.back()} />
        <div className="overflow-y-auto flex-1 min-h-0">
          <SheetHeader>
            <SheetTitle className="text-lg lg:text-xl">
              投稿の詳細情報
            </SheetTitle>
            <SheetDescription className="sr-only">
              投稿の詳細情報
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 flex-1">
            <Image
              src={item.imageUrl || ""}
              alt="投稿画像"
              width={500}
              height={500}
              className="lg:w-[35%] lg:h-[35%] w-[90%] h-[90%] object-cover rounded my-4"
            />
            <div className="flex flex-col justify-center gap-4 lg:px-6">
              <div className="flex flex-col justify-center gap-4 lg:gap-2">
                <div className="flex items-center gap-2 border border-gray-100 bg-green-500 rounded-md w-fit px-4 py-1">
                  <MessageCircle className="size-6 text-white" />
                  <span className="text-sm lg:text-base font-bold text-white">
                    コメント
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-4 lg:gap-2 bg-gray-100 rounded-md p-4">
                  <p className="text-base lg:text-base px-4">
                    {commentFormatted}
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-6">
                <div className="flex items-center gap-2 text-center">
                  <User className="size-6" />
                  <span className="text-sm lg:text-base">{nameFormatted}</span>
                </div>
                <div className="flex items-center gap-2 text-center">
                  <Calendar className="size-6" />
                  <span className="text-sm lg:text-base">
                    {shootingDateFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Googleマップ経路ボタン */}
        <div className="p-4 border-t shrink-0 bg-gray-200 w-full flex justify-center">
          <GoogleMapButton destination={destination} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
