// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 0.8;

// ----------------------------------------------------------------
// ブラウザ判定
// ----------------------------------------------------------------
const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

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
  const buffer = await file.slice(0, 32768).arrayBuffer(); // 先頭32KBで十分
  const view = new DataView(buffer);

  // PNG: 先頭8バイトがPNGシグネチャ、IHDRチャンクにサイズ
  if (
    view.getUint32(0) === 0x89504e47 && // \x89PNG
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
      if (marker === 0xffd9) break; // EOI

      // SOFマーカー（0xFFC0-0xFFC3, 0xFFC5-0xFFC7, 0xFFC9-0xFFCB, 0xFFCD-0xFFCF）
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

      // 次のマーカーへ
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
    view.getUint32(0) === 0x52494646 && // "RIFF"
    view.getUint32(8) === 0x57454250 // "WEBP"
  ) {
    const chunkType = view.getUint32(12);

    // VP8 (lossy)
    if (chunkType === 0x56503820) {
      // "VP8 "
      // フレームタグの後にサイズ（リトルエンディアン）
      const frameStart = 20;
      if (view.getUint8(frameStart) === 0x9d) {
        return {
          width: view.getUint16(frameStart + 6, true) & 0x3fff,
          height: view.getUint16(frameStart + 8, true) & 0x3fff,
        };
      }
    }

    // VP8L (lossless)
    if (chunkType === 0x5650384c) {
      // "VP8L"
      const signature = view.getUint8(21);
      if (signature === 0x2f) {
        const bits = view.getUint32(22, true);
        return {
          width: (bits & 0x3fff) + 1,
          height: ((bits >> 14) & 0x3fff) + 1,
        };
      }
    }

    // VP8X (extended)
    if (chunkType === 0x56503858) {
      // "VP8X"
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

  return null; // 読み取れなかった場合
};

// ----------------------------------------------------------------
// Safari向け：new Image()方式
// - 実績のある安定した方式
// - URL.revokeObjectURL()でメモリ解放
// ----------------------------------------------------------------
const compressWithImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // リサイズ計算（アスペクト比維持）
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Canvas作成・描画
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context取得失敗");
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Blob化
        canvas.toBlob(
          (blob) => {
            // 解放処理
            canvas.width = 0;
            canvas.height = 0;
            URL.revokeObjectURL(url);

            if (!blob) {
              reject(new Error("圧縮に失敗しました"));
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              { type: "image/jpeg" },
            );
            resolve(compressedFile);
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
// Chrome向け：createImageBitmap方式
// - ヘッダからサイズを読み取り、最適なresizeオプションを選択
// - デコード時にリサイズすることでメモリ効率を最大化
// - bitmap.close()で即座にメモリ解放可能
// ----------------------------------------------------------------
const compressWithBitmap = async (file: File): Promise<File> => {
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    // ヘッダから画像サイズを読み取り
    const dimensions = await readImageDimensions(file);

    // 最適なresizeオプションを決定
    let resizeOptions: ImageBitmapOptions | undefined;
    if (dimensions) {
      const { width: origW, height: origH } = dimensions;

      // リサイズが必要な場合のみオプションを設定
      if (origW > MAX_WIDTH || origH > MAX_HEIGHT) {
        // 横長または正方形 → resizeWidthを指定
        // 縦長 → resizeHeightを指定
        if (origW >= origH) {
          resizeOptions = { resizeWidth: MAX_WIDTH, resizeQuality: "high" };
        } else {
          resizeOptions = { resizeHeight: MAX_HEIGHT, resizeQuality: "high" };
        }
      }
    }

    // デコード（resizeオプションがあればデコード時にリサイズ）
    bitmap = resizeOptions
      ? await createImageBitmap(file, resizeOptions)
      : await createImageBitmap(file);

    // Canvasに描画（追加リサイズ不要、そのままのサイズで描画）
    canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context取得失敗");
    }
    ctx.drawImage(bitmap, 0, 0);

    // bitmap即解放（ここでメモリ解放）
    bitmap.close();
    bitmap = null;

    // Blob化
    return new Promise((resolve, reject) => {
      canvas!.toBlob(
        (blob) => {
          // canvas破棄
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
          }

          if (!blob) {
            reject(new Error("圧縮に失敗しました"));
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".jpg"),
            { type: "image/jpeg" },
          );
          resolve(compressedFile);
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  } catch (error) {
    // エラー時も確実に解放
    if (bitmap) bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    throw error;
  }
};

// ----------------------------------------------------------------
// メインエントリポイント：ブラウザ判定して分岐
// ----------------------------------------------------------------
export const compressImageLib = async (file: File): Promise<File> => {
  if (isSafari()) {
    return compressWithImage(file);
  }
  return compressWithBitmap(file);
};
