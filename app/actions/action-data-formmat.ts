"use server";
import { transferToFormatted } from "@/lib/data-format-generate/transfer-to-formatted";
import { extractImageLocation } from "@/lib/data-format-generate/extract-image-location";
import { fetchAddress } from "@/lib/data-format-generate/fetch-address";
import { mergeNearbyLocations } from "@/lib/data-format-generate/merge-nearby-locations";

export async function dataFormmatLocate() {
  const details = await transferToFormatted();
  if (!details.success) {
    return details;
  }
  const imageLocation = await extractImageLocation();
  const address = await fetchAddress();
  const mergeLocations = await mergeNearbyLocations();
  console.log(details);
  console.log(imageLocation);
  console.log(address);
  console.log(mergeLocations);
}
