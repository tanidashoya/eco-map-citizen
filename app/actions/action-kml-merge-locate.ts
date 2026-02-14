"use server";

import { generateKmlMerged } from "@/lib/data-format-generate/generate-kml-merged";

export async function kmlMergeLocate() {
  return await generateKmlMerged();
}
