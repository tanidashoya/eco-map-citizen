import { Camera, MapPin, MapPinned, Plane, Satellite } from "lucide-react";
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
      // size="icon-lg"
      onClick={handleMapType}
      className="absolute lg:bottom-20 lg:right-6 bottom-20 right-6 z-999 bg-white text-black border-blue-500 border-2 rounded-md cursor-pointer text-sm hover:bg-gray-200 shadow-md"
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
