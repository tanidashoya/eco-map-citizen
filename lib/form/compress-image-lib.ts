// ----------------------------------------------------------------
// 定数
// ----------------------------------------------------------------
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.8;

// ----------------------------------------------------------------
// ブラウザ判定
// ----------------------------------------------------------------
const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
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
// - デコード時にリサイズすることでメモリ効率を最大化
// - bitmap.close()で即座にメモリ解放可能
// ----------------------------------------------------------------
const compressWithBitmap = async (file: File): Promise<File> => {
  let bitmap: ImageBitmap | null = null;
  let canvas: HTMLCanvasElement | null = null;

  try {
    // resizeWidthのみ指定でアスペクト比を維持しながらデコード時にリサイズ
    // ※両方指定するとアスペクト比が崩れる可能性があるため片方のみ
    bitmap = await createImageBitmap(file, {
      resizeWidth: MAX_WIDTH,
      resizeQuality: "high",
    });

    // 高さがMAX_HEIGHTを超える場合のみ追加リサイズ計算（縦長画像対応）
    let width = bitmap.width;
    let height = bitmap.height;
    if (height > MAX_HEIGHT) {
      const ratio = MAX_HEIGHT / height;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Canvas作成・描画
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context取得失敗");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

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
