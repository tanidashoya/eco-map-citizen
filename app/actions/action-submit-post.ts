"use server";

import {
  appendSheetData,
  uploadImageToDrive,
} from "@/lib/google-api/google-api";
import {
  compressImage,
  getCompressedMimeType,
} from "@/lib/image/compress-image";

export type SubmitPostResult =
  | { success: true; message: string }
  | { success: false; message: string };

/**
 * 投稿フォームのServer Action
 * FormDataを受け取り、投稿処理を実行する
 * 位置情報はGeolocation APIで取得したものをクライアントから受け取る
 */
export async function submitPost(
  formData: FormData,
): Promise<SubmitPostResult> {
  try {
    // FormDataから値を取得
    const category = (formData.get("category") as string) ?? "";
    const image = formData.get("image") as File | null;
    const name = (formData.get("name") as string) ?? "";
    const address = (formData.get("address") as string) ?? "";
    const birthdate = (formData.get("birthdate") as string) ?? "";
    const comment = (formData.get("comment") as string) ?? "";
    // Geolocation APIで取得した位置情報
    const latitude = (formData.get("latitude") as string) ?? "";
    const longitude = (formData.get("longitude") as string) ?? "";
    // 撮影時刻
    const capturedAt = (formData.get("capturedAt") as string) ?? "";

    // バリデーション
    if (!category) {
      return { success: false, message: "カテゴリが必要です" };
    }
    if (!image || image.size === 0) {
      return { success: false, message: "写真が必要です" };
    }
    if (!latitude || !longitude) {
      return { success: false, message: "位置情報が必要です" };
    }

    // 画像を圧縮してGoogle Driveにアップロード
    const originalBuffer = Buffer.from(await image.arrayBuffer());
    const compressedBuffer = await compressImage(originalBuffer, image.type);
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const mimeType = getCompressedMimeType(); // 常にJPEG
    const imageUrl = await uploadImageToDrive(
      compressedBuffer,
      folderId,
      mimeType,
    );
    console.log("imageUrl", imageUrl);

    // スプレッドシートに追記するデータ
    // 列順: 画像カテゴリ, 画像URL, お名前, お住まいの地域, 生年月日, この場所についての一言, 緯度, 経度, 撮影時間
    const values = [
      category,
      imageUrl,
      name.trim(),
      address,
      birthdate,
      comment.trim(),
      latitude,
      longitude,
      capturedAt,
    ];
    await appendSheetData("user_input", [values]);

    console.log("投稿データ:", {
      category,
      name: name.trim(),
      address,
      birthdate,
      comment: comment.trim(),
      latitude,
      longitude,
      capturedAt,
      imageSize: image.size,
      imageName: image.name,
    });

    return { success: true, message: "投稿が完了しました！" };
  } catch (error) {
    console.error("投稿処理エラー:", error);
    return {
      success: false,
      message: "送信に失敗しました。もう一度お試しください。",
    };
  }
}
