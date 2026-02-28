// 圧縮設定
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1280;
const JPEG_QUALITY = 0.8;

/**
 * 画像圧縮のメインエントリポイント
 * createImageBitmap対応ブラウザは効率的な方式を使用
 * 非対応ブラウザは従来のImage方式にフォールバック
 */
export const compressImageLib = async (file: File): Promise<File> => {
  if (typeof createImageBitmap === "function") {
    return compressWithBitmap(file);
  }
  return compressWithImage(file);
};

/**
 * createImageBitmapを使用した圧縮（推奨）
 * - Imageより効率的なデコード
 * - .close()で即座にメモリ解放可能
 */
const compressWithBitmap = async (file: File): Promise<File> => {
  const bitmap = await createImageBitmap(file);

  try {
    // リサイズ計算
    let width = bitmap.width;
    let height = bitmap.height;
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
    ctx.drawImage(bitmap, 0, 0, width, height);

    // 描画完了後、即座にメモリ解放
    bitmap.close();

    // Blob化
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          // Canvas用メモリも解放
          canvas.width = 0;
          canvas.height = 0;

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
    // エラー時もメモリ解放を試みる
    try {
      bitmap.close();
    } catch {
      // close()が失敗しても無視
    }
    throw error;
  }
};

/**
 * 従来のImage要素を使用した圧縮（フォールバック）
 * createImageBitmap非対応ブラウザ用
 */
const compressWithImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      // 元画像のURL解放
      URL.revokeObjectURL(url);

      // リサイズ計算
      let { width, height } = img;
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
        reject(new Error("Canvas context取得失敗"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Blob化
      canvas.toBlob(
        (blob) => {
          // Canvas用メモリ解放
          canvas.width = 0;
          canvas.height = 0;

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
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました"));
    };

    img.src = url;
  });
};
