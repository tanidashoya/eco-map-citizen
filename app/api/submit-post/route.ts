import { NextRequest, NextResponse } from "next/server";
import {
  appendSheetData,
  uploadImageToDrive,
} from "@/lib/google-api/google-api";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // FormDataから値を取得
    const image = formData.get("image") as File | null;
    const name = (formData.get("name") as string) ?? "";
    const address = (formData.get("address") as string) ?? "";
    const birthdate = (formData.get("birthdate") as string) ?? "";
    const comment = (formData.get("comment") as string) ?? "";
    const timestamp = (formData.get("timestamp") as string) ?? "";

    // バリデーション
    if (!image || image.size === 0) {
      return NextResponse.json(
        { success: false, message: "写真が必要です" },
        { status: 400 }
      );
    }

    // 画像をGoogle Driveにアップロード
    const buffer = Buffer.from(await image.arrayBuffer());
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    const mimeType = image.type;
    const imageUrl = await uploadImageToDrive(buffer, folderId, mimeType);

    // スプレッドシートに追記
    const values = [
      timestamp,
      name.trim(),
      address,
      birthdate,
      imageUrl,
      comment.trim(),
    ];
    await appendSheetData("user_input", [values]);

    console.log("投稿データ:", {
      timestamp,
      name: name.trim(),
      address,
      birthdate,
      comment: comment.trim(),
      imageSize: image.size,
      imageName: image.name,
    });

    return NextResponse.json({
      success: true,
      message: "投稿が完了しました！",
    });
  } catch (error) {
    console.error("投稿処理エラー:", error);
    return NextResponse.json(
      {
        success: false,
        message: "送信に失敗しました。もう一度お試しください。",
      },
      { status: 500 }
    );
  }
}
