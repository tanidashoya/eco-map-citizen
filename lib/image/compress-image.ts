import sharp from "sharp";

// 画像圧縮設定
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const JPEG_QUALITY = 80;

/**
 * 画像を圧縮・リサイズする（サーバーサイド）
 * sharpライブラリを使用した一般的で確実な方法
 *
 * @param buffer - 元画像のBuffer
 * @param mimeType - 元画像のMIMEタイプ（未使用、常にJPEG出力）
 * @returns 圧縮後の画像Buffer
 */
export async function compressImage(
  buffer: Buffer,
  _mimeType?: string,
): Promise<Buffer> {
  const originalSize = buffer.length;

  const compressedBuffer = await sharp(buffer)
    .resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
      fit: "inside", // アスペクト比を維持して収まるようにリサイズ
      withoutEnlargement: true, // 元画像より大きくしない
    })
    .jpeg({
      quality: JPEG_QUALITY,
      mozjpeg: true, // より効率的な圧縮
    })
    .toBuffer();

  const compressedSize = compressedBuffer.length;
  console.log(
    `画像圧縮: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB`,
  );

  return compressedBuffer;
}

/**
 * 圧縮後のMIMEタイプを取得
 * 常にJPEGで出力するため固定値を返す
 */
export function getCompressedMimeType(): string {
  return "image/jpeg";
}
