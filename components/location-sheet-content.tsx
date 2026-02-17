import { ClusterItem } from "@/types/maps";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function LocationSheetContent({
  selectedItem,
}: {
  selectedItem: ClusterItem;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clusterId = searchParams.get("cluster");
  const itemId = searchParams.get("item");

  if (!selectedItem) {
    return null;
  }
  return (
    <>
      <Sheet
        open={itemId === selectedItem.uniqueId}
        onOpenChange={(open) => {
          //モーダルを閉じた時(openがfalseの時)
          if (!open) {
            router.push(`/?cluster=${clusterId}`);
          }
        }}
      >
        <SheetContent
          side="right"
          className="!w-screen !max-w-none !h-screen"
          hideOverlay={true}
        >
          <div className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg lg:text-xl">
                {selectedItem.name || "匿名ユーザー"}
              </SheetTitle>
              <SheetDescription className="sr-only">
                投稿の詳細
              </SheetDescription>
            </SheetHeader>
            <div className="flex items-center justify-center lg:mt-6">
              <Image
                src={selectedItem.imageUrl || ""}
                alt="投稿画像"
                width={500}
                height={500}
                className="lg:w-36 lg:h-36 w-[90%] h-[90%] object-cover rounded mt-2"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
