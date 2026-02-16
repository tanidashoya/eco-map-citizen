import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClusterItem } from "@/types/maps";
import { useRouter, useSearchParams } from "next/navigation";

export default function LocationDialog({
  selectedItem,
}: {
  selectedItem: ClusterItem | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pointId = searchParams.get("point");

  // selectedItemがnullの場合は何も表示しない
  if (!selectedItem) {
    return null;
  }

  return (
    <Dialog
      open={!!pointId}
      onOpenChange={(open) => {
        if (!open) {
          router.push("/");
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>投稿詳細</DialogTitle>
          <DialogDescription className="sr-only">
            選択した投稿の詳細
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {selectedItem.shootingDate && (
            <p className="text-sm text-gray-500">{selectedItem.shootingDate}</p>
          )}
          {selectedItem.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedItem.imageUrl}
              alt="投稿画像"
              className="w-full rounded-lg"
            />
          )}
          {selectedItem.comment && (
            <p className="text-sm text-gray-700">{selectedItem.comment}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
