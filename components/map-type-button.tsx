import { MapPinned, Plane } from "lucide-react";
import { Button } from "./ui/button";

export default function MapTypeButton({
  handleMapType,
  mapTypePic,
}: {
  handleMapType: () => void;
  mapTypePic: boolean;
}) {
  return (
    <Button
      onClick={handleMapType}
      className="bg-white text-black border-blue-500 border-2 rounded-md cursor-pointer text-sm hover:bg-gray-200 shadow-md"
    >
      {mapTypePic ? (
        <>
          <Plane className="size-5" />
          <span>航空写真</span>
        </>
      ) : (
        <>
          <MapPinned className="size-5" />
          <span>地図</span>
        </>
      )}
    </Button>
  );
}
