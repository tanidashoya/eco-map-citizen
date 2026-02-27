import sharp from "sharp";

// 画像圧縮設定（リサイズなし、品質のみ調整）
const JPEG_QUALITY = 80;

/**
 * 画像を圧縮する（サーバーサイド）
 * sharpライブラリを使用した一般的で確実な方法
 * リサイズは行わず、JPEG品質のみで圧縮（アスペクト比・サイズは維持）
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
