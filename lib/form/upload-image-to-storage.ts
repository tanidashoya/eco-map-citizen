import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * 画像アップロード結果の型
 */
export type UploadResult =
  | { success: true; storagePath: string; publicUrl: string }
  | { success: false; error: string };

/**
 * 画像をSupabase Storageにアップロードし、公開URLを取得する
 *
 * @param originalFileName - 元のファイル名（サニタイズ用）
 * @param blob - アップロードする画像データ
 * @param mimeType - MIMEタイプ（例: 'image/webp', 'image/jpeg'）
 * @param extension - ファイル拡張子（例: 'webp', 'jpeg'）
 * @returns アップロード結果（storagePath と publicUrl、またはエラー）
 */
export async function uploadImageToStorage(
  originalFileName: string,
  blob: Blob,
  mimeType: string,
  extension: string
): Promise<UploadResult> {
  const supabase = createSupabaseBrowserClient();

  // ファイル名をサニタイズ（英数字とハイフン、ドットのみ残す）
  const sanitizedName = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, "")
    .replace(/\.[^.]+$/, ""); // 拡張子を除去

  // ユニークなパスを生成
  const uuid = crypto.randomUUID();
  const storagePath = `${uuid}-${sanitizedName || "image"}.${extension}`;

  // Supabase Storageにアップロード
  const { error: uploadError } = await supabase.storage
    .from("observations")
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      error: uploadError.message,
    };
  }

  // 公開URLを取得
  const { data: urlData } = supabase.storage
    .from("observations")
    .getPublicUrl(storagePath);

  return {
    success: true,
    storagePath,
    publicUrl: urlData.publicUrl,
  };
}
