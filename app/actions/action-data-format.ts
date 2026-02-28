"use server";
import { revalidatePath } from "next/cache";
import { transferToFormatted } from "@/lib/data-format-generate/transfer-to-formatted";
import { extractImageLocation } from "@/lib/data-format-generate/extract-image-location";
// import { fetchAddress } from "@/lib/data-format-generate/fetch-address";
// import { mergeNearbyLocations } from "@/lib/data-format-generate/merge-nearby-locations";

export async function ActionDataFormmatLocate() {
  const details = await transferToFormatted();
  if (!details.success) {
    return details;
  }
  const imageLocation = await extractImageLocation();
  if (!imageLocation.success) {
    return imageLocation;
  }
  // const address = await fetchAddress();
  // if (!address.success) {
  //   return address;
  // }
  // const mergeLocations = await mergeNearbyLocations();
  // if (!mergeLocations.success) {
  //   return mergeLocations;
  // }

  // マップページのキャッシュを再検証（本番環境でデータが反映されるように）
  revalidatePath("/");

  return {
    success: true,
    message: "マップへの反映が完了しました",
    processedCount: imageLocation.processedCount,
  };
}
