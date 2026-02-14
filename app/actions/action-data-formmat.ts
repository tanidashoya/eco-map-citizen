"use server";
import { transferToFormatted } from "@/lib/data-format-generate/transfer-to-formatted";
import { extractImageLocation } from "@/lib/data-format-generate/extract-image-location";
import { fetchAddress } from "@/lib/data-format-generate/fetch-address";
import { mergeNearbyLocations } from "@/lib/data-format-generate/merge-nearby-locations";

export async function ActionDataFormmatLocate() {
  const details = await transferToFormatted();
  if (!details.success) {
    return details;
  }
  const imageLocation = await extractImageLocation();
  if (!imageLocation.success) {
    return imageLocation;
  }
  const address = await fetchAddress();
  if (!address.success) {
    return address;
  }
  const mergeLocations = await mergeNearbyLocations();
  console.log(details);
  console.log(imageLocation);
  console.log(address);
  console.log(mergeLocations);
}
