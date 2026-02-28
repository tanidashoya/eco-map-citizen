// 圧縮設定
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
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
  //JPEG⇒ピクセル配列への変換（デコード）
  const bitmap = await createImageBitmap(file);

  //圧縮処理中に何か失敗してもbitmapのメモリを必ず開放する
  try {
    // リサイズ計算
    let width = bitmap.width; //元の画像の幅
    let height = bitmap.height; //元の画像の高さ
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      //最大幅・高さを超えていたらリサイズ(Math.minで小さい方を基準にリサイズ)
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height); //ratioはリサイズ倍率(最大枠を超えないための最小倍率)
      width = Math.round(width * ratio); //（“最大枠を超えないための最小倍率” を両方に掛けている）
      height = Math.round(height * ratio); //同じ倍率をかけないと縦や横に縮んだ画像になる
    }

    // Canvas作成・描画（縮小後のサイズで新しい画像を書き直している）
    const canvas = document.createElement("canvas"); //空のキャンバスを作成（DOM上に作成しているが画面には追加してない）
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d"); //キャンバスに描画するためのコンテキストを取得（2D描画エンジンを取得）
    if (!ctx) {
      throw new Error("Canvas context取得失敗");
    }
    ctx.drawImage(bitmap, 0, 0, width, height); //元画像を指定したサイズにスケーリングして描画

    // 描画完了後、即座にメモリ解放
    bitmap.close(); //bitmap（ピクセル配列）のメモリを開放（ここがメモリ不足の要因となる）

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
