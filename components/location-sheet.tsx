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
  const locationId = searchParams.get("location");

  // selectedPointがnullの場合は何も表示しない
  if (!selectedPoint) {
    return null;
  }

  return (
    <Sheet
      open={!!locationId}
      onOpenChange={(open) => {
        //モーダルを閉じた時(openがfalseの時)
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
            {selectedPoint.items.map((item: ClusterItem, index: number) => (
              <LocationItem item={item} key={`${item.uniqueId}-${index}`} />
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
