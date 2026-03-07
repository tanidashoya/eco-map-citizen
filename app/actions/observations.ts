"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

// ========== 投稿関連 ==========

export type SubmitObservationParams = {
  imageCategory: string;
  imageUrl: string; // Client から受け取る（Storage Upload 後の公開 URL）
  observerName: string;
  observerArea?: string;
  observerBirthDate?: string;
  comment?: string;
  latitude: number;
  longitude: number;
  capturedAt?: string;
  storagePath: string; // cleanup 用のファイルパス
};

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

/**
 * DB に観察データを INSERT する
 * 画像は Client 側で Storage にアップロード済み
 * image_url は確定した公開 URL を受け取る
 */
export async function submitObservation(
  params: SubmitObservationParams,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  // バリデーション
  if (!params.imageCategory || !params.imageUrl || !params.observerName) {
    return { success: false, error: "必須項目が不足しています" };
  }
  if (isNaN(params.latitude) || isNaN(params.longitude)) {
    return { success: false, error: "位置情報が不正です" };
  }

  const { error } = await supabase.from("observations").insert({
    image_category: params.imageCategory,
    image_url: params.imageUrl,
    observer_name: params.observerName,
    observer_area: params.observerArea || null,
    observer_birth_date: params.observerBirthDate || null,
    comment: params.comment || null,
    latitude: params.latitude,
    longitude: params.longitude,
    captured_at: params.capturedAt || null,
  });

  if (error) {
    // DB INSERT 失敗 → Storage の画像を cleanup
    await supabase.storage.from("observations").remove([params.storagePath]);
    return { success: false, error: `データ保存失敗: ${error.message}` };
  }

  return { success: true };
}

// ========== 管理者用アクション ==========

/**
 * 承認 / 却下（ステータス更新）
 */
export async function updateObservationStatus(
  id: string,
  newStatus: "approved" | "rejected",
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("observations")
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * メタデータ更新
 */
export async function updateObservation(
  id: string,
  updates: {
    image_category?: string;
    observer_name?: string;
    observer_area?: string;
    comment?: string;
  },
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("observations")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 削除（DB + Storage）
 */
export async function deleteObservation(
  id: string,
  imageUrl: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  // image_url からファイルパスを抽出
  const filePath = imageUrl.split("/observations/").pop();

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from("observations")
      .remove([filePath]);

    if (storageError) {
      console.error("Storage delete failed:", storageError.message);
      // Storage 削除失敗でも DB 削除は続行
    }
  }

  const { error: dbError } = await supabase
    .from("observations")
    .delete()
    .eq("id", id);

  if (dbError) {
    return { success: false, error: dbError.message };
  }

  return { success: true };
}
