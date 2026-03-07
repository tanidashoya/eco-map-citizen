"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { transferToFormatted } from "@/lib/data-format-generate/transfer-to-formatted";
import { extractImageLocation } from "@/lib/data-format-generate/extract-image-location";
import { fetchAddress } from "@/lib/data-format-generate/fetch-address";
import { generateKmlFormatted } from "@/lib/data-format-generate/generate-kml-formatted";
import { mergeNearbyLocations } from "@/lib/data-format-generate/merge-nearby-locations";
import { generateKmlMerged } from "@/lib/data-format-generate/generate-kml-merged";
import type { ActionResponse } from "@/types/data-format-generate/types";

// ① 転記
export async function transferAction(): Promise<ActionResponse> {
  try {
    return await transferToFormatted();
  } catch (error) {
    console.error("転記エラー:", error);
    return { success: false, message: "転記に失敗しました" };
  }
}

// ② 位置情報取得
export async function extractLocationAction(): Promise<ActionResponse> {
  try {
    return await extractImageLocation();
  } catch (error) {
    console.error("位置情報取得エラー:", error);
    return { success: false, message: "位置情報の取得に失敗しました" };
  }
}

// ③ 住所取得
export async function fetchAddressAction(): Promise<ActionResponse> {
  try {
    return await fetchAddress();
  } catch (error) {
    console.error("住所取得エラー:", error);
    return { success: false, message: "住所の取得に失敗しました" };
  }
}

// ④ KML生成（個別）
export async function generateKmlFormattedAction(): Promise<
  ActionResponse & { downloadUrl?: string }
> {
  try {
    const result = await generateKmlFormatted();
    if (!result.content) return result;

    const filename = `formatted-${Date.now()}.kml`;
    const dir = join(process.cwd(), "public", "downloads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), result.content, "utf-8");

    return { ...result, downloadUrl: `/downloads/${filename}` };
  } catch (error) {
    console.error("KML生成エラー:", error);
    return { success: false, message: "KML生成に失敗しました" };
  }
}

// ⑤ 近接地点統合
export async function mergeLocationsAction(): Promise<ActionResponse> {
  try {
    return await mergeNearbyLocations();
  } catch (error) {
    console.error("統合エラー:", error);
    return { success: false, message: "統合に失敗しました" };
  }
}

// ⑥ KML生成（統合版）
export async function generateKmlMergedAction() {
  try {
    return await generateKmlMerged();
  } catch (error) {
    console.error("KML生成エラー:", error);
    return { success: false, message: "KML生成に失敗しました" };
  }
}
