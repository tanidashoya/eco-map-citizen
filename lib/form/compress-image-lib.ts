// lib/form/compress-image-lib.ts
//
// 役割: 画像を圧縮してファイルサイズを削減
// createImageBitmap方式を統一使用（Safari/Chrome両対応）
// resizeオプションを試みつつ、非対応環境ではCanvas上でリサイズ

// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 0.8;

// ----------------------------------------------------------------
// 画像ヘッダからサイズを読み取る（フルデコードせずにアスペクト比を取得）
// ----------------------------------------------------------------
interface ImageDimensions {
  width: number;
  height: number;
}

const readImageDimensions = async (
  file: File,
): Promise<ImageDimensions | null> => {
  try {
    const buffer = await file.slice(0, 32768).arrayBuffer();
    const view = new DataView(buffer);

    // PNG: 先頭8バイトがPNGシグネチャ、IHDRチャンクにサイズ
    if (
      view.getUint32(0) === 0x89504e47 &&
      view.getUint32(4) === 0x0d0a1a0a
    ) {
      return {
        width: view.getUint32(16),
        height: view.getUint32(20),
      };
    }

    // JPEG: 0xFFD8で始まり、SOFマーカーにサイズ
    if (view.getUint16(0) === 0xffd8) {
      let offset = 2;
      while (offset < buffer.byteLength - 8) {
        const marker = view.getUint16(offset);
        if (marker === 0xffd9) break;

        if (
          (marker >= 0xffc0 && marker <= 0xffc3) ||
          (marker >= 0xffc5 && marker <= 0xffc7) ||
          (marker >= 0xffc9 && marker <= 0xffcb) ||
          (marker >= 0xffcd && marker <= 0xffcf)
        ) {
          return {
            height: view.getUint16(offset + 5),
            width: view.getUint16(offset + 7),
          };
        }

        if (marker === 0xffff) {
          offset++;
        } else if ((marker & 0xff00) === 0xff00) {
          const length = view.getUint16(offset + 2);
          offset += 2 + length;
        } else {
          offset++;
        }
      }
    }

    // WebP: "RIFF"で始まり"WEBP"が続く
    if (
      view.getUint32(0) === 0x52494646 &&
      view.getUint32(8) === 0x57454250
    ) {
      const chunkType = view.getUint32(12);

      if (chunkType === 0x56503820) {
        const frameStart = 20;
        if (view.getUint8(frameStart) === 0x9d) {
          return {
            width: view.getUint16(frameStart + 6, true) & 0x3fff,
            height: view.getUint16(frameStart + 8, true) & 0x3fff,
          };
        }
      }

      if (chunkType === 0x5650384c) {
        const signature = view.getUint8(21);
        if (signature === 0x2f) {
          const bits = view.getUint32(22, true);
          return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1,
          };
        }
      }

      if (chunkType === 0x56503858) {
        return {
          width:
            (view.getUint8(24) |
              (view.getUint8(25) << 8) |
              (view.getUint8(26) << 16)) +
            1,
          height:
            (view.getUint8(27) |
              (view.getUint8(28) << 8) |
              (view.getUint8(29) << 16)) +
            1,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
};

// ----------------------------------------------------------------
// フォールバック用：new Image()方式
// createImageBitmapが使えない古い環境用
// ----------------------------------------------------------------
const compressWithImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context取得失敗");
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            canvas.width = 0;
            canvas.height = 0;
            URL.revokeObjectURL(url);

            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          },
          "image/jpeg",
          JPEG_QUALITY,
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
};

// ----------------------------------------------------------------
// メイン：createImageBitmap方式（Safari/Chrome統一）
// - resizeオプションを試みる（対応環境ではデコード時リサイズでメモリ効率向上）
// - 非対応でもCanvas上でリサイズするので動作する
// - bitmap.close()で明示的にメモリ解放
// ----------------------------------------------------------------
const compressWithBitmap = async (file: File): Promise<File> => {
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    // ヘッダから画像サイズを読み取り
    const dimensions = await readImageDimensions(file);
    const needsResize =
      dimensions &&
      (dimensions.width > MAX_WIDTH || dimensions.height > MAX_HEIGHT);

    // createImageBitmapでデコード
    if (needsResize && dimensions) {
      // resizeオプションを試みる（Safari 17+, Chrome, Firefoxで有効）
      try {
        const resizeOptions: ImageBitmapOptions =
          dimensions.width >= dimensions.height
            ? { resizeWidth: MAX_WIDTH, resizeQuality: "high" }
            : { resizeHeight: MAX_HEIGHT, resizeQuality: "high" };
        bitmap = await createImageBitmap(file, resizeOptions);
      } catch {
        // resizeオプション非対応の場合、オプションなしでデコード
        bitmap = await createImageBitmap(file);
      }
    } else {
      // リサイズ不要、またはサイズ取得失敗
      bitmap = await createImageBitmap(file);
    }

    // 最終サイズを計算（resizeオプションが効いていない可能性があるため）
    let finalWidth = bitmap.width;
    let finalHeight = bitmap.height;
    if (finalWidth > MAX_WIDTH || finalHeight > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / finalWidth, MAX_HEIGHT / finalHeight);
      finalWidth = Math.round(finalWidth * ratio);
      finalHeight = Math.round(finalHeight * ratio);
    }

    // Canvas作成・描画
    canvas = document.createElement("canvas");
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context取得失敗");
    }
    ctx.drawImage(bitmap, 0, 0, finalWidth, finalHeight);

    // bitmap即解放（ここでメモリ解放）
    bitmap.close();
    bitmap = null;

    // Blob化
    return new Promise((resolve, reject) => {
      canvas!.toBlob(
        (blob) => {
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
          }

          if (!blob) {
            reject(new Error("圧縮に失敗しました"));
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  } catch (error) {
    if (bitmap) bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    throw error;
  }
};

// ----------------------------------------------------------------
// エントリポイント
// createImageBitmapが使えない環境ではImage方式にフォールバック
// ----------------------------------------------------------------
export const compressImageLib = async (file: File): Promise<File> => {
  if (typeof createImageBitmap === "undefined") {
    return compressWithImage(file);
  }
  return compressWithBitmap(file);
};
