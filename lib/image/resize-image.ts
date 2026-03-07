/**
 * リサイズ結果の型
 * blob: リサイズ済み画像データ
 * mimeType: 実際に使用されたフォーマット（'image/webp' or 'image/jpeg'）
 * extension: ファイル拡張子（'webp' or 'jpeg'）
 */
export type ResizeResult = {
  blob: Blob;
  mimeType: "image/webp" | "image/jpeg";
  extension: "webp" | "jpeg";
};

/**
 * 画像を Canvas でリサイズし、WebP（優先）または JPEG（フォールバック）で返す
 *
 * 省メモリのポイント:
 * - Base64 ではなく Blob URL を使用
 * - 処理完了後に revokeObjectURL で即座にメモリ解放
 * - Canvas サイズを 0 にリセットして GC 対象にする
 *
 * iOS WebP 対応:
 * - canvas.toBlob('image/webp') が null を返す場合（iOS 15以前）
 * - 自動的に 'image/jpeg' にフォールバック
 * - 呼び出し側は戻り値の mimeType / extension で判定可能
 */
export async function resizeImage(
  file: File,
  maxLongSide: number = 1200,
  quality: number = 0.8,
): Promise<ResizeResult> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;
      const longSide = Math.max(width, height);

      if (longSide > maxLongSide) {
        const ratio = maxLongSide / longSide;
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // まず WebP で試行
      canvas.toBlob(
        (webpBlob) => {
          if (webpBlob) {
            // WebP 成功
            canvas.width = 0;
            canvas.height = 0;
            resolve({
              blob: webpBlob,
              mimeType: "image/webp",
              extension: "webp",
            });
            return;
          }

          // WebP 失敗（iOS 15以前など）→ JPEG にフォールバック
          canvas.toBlob(
            (jpegBlob) => {
              canvas.width = 0;
              canvas.height = 0;

              if (!jpegBlob) {
                reject(
                  new Error("Image conversion failed (both WebP and JPEG)"),
                );
                return;
              }

              resolve({
                blob: jpegBlob,
                mimeType: "image/jpeg",
                extension: "jpeg",
              });
            },
            "image/jpeg",
            quality,
          );
        },
        "image/webp",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Image load failed"));
    };

    img.src = blobUrl;
  });
}
