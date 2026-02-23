"use server";

import {
  appendSheetData,
  uploadImageToDrive,
} from "@/lib/google-api/google-api";

export type SubmitPostResult =
  | { success: true; message: string }
  | { success: false; message: string };

/**
 * 投稿フォームのServer Action
 * FormDataを受け取り、投稿処理を実行する
 */
export async function submitPost(
  formData: FormData,
): Promise<SubmitPostResult> {
  try {
    // FormDataから値を取得
    const image = formData.get("image") as File | null;
    const name = (formData.get("name") as string) ?? "";
    const address = (formData.get("address") as string) ?? "";
    const birthdate = (formData.get("birthdate") as string) ?? "";
    const comment = (formData.get("comment") as string) ?? "";
    const timestamp = (formData.get("timestamp") as string) ?? "";

    // バリデーション
    if (!image || image.size === 0) {
      return { success: false, message: "写真が必要です" };
    }

    // const buffer = await image.arrayBuffer();
    // 正しい（BufferはArrayBufferからの変換が必要）
    const buffer = Buffer.from(await image.arrayBuffer());
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!; //保存先のgoogle driveのフォルダーID
    const mimeType = image.type; //画像のMIMEタイプ
    const imageUrl = await uploadImageToDrive(buffer, folderId, mimeType); //画像をGoogle Driveにアップロード
    console.log("imageUrl", imageUrl);

    const values = [
      timestamp,
      name.trim(),
      address,
      birthdate,
      comment.trim(),
      imageUrl,
    ];
    await appendSheetData("user_input", [values]); //スプレッドシートにデータを追記

    console.log("投稿データ:", {
      timestamp,
      name: name.trim(),
      address,
      birthdate,
      comment: comment.trim(),
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
