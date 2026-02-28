export const compressImageLib = (file: File): Promise<File> => {
  const MAX_WIDTH = 1280; // 最大幅
  const MAX_HEIGHT = 1280; // 最大高さ
  const JPEG_QUALITY = 0.8; // 圧縮品質（0.0〜1.0）

  //img.onloadとcanvas.toBlobの両方が非同期処理なので、Promiseを使用して順番に実行する
  return new Promise((resolve, reject) => {
    const img = new Image();
    /*
    ユーザーが撮影を終えて「OK」を押した時点でブラウザはその画像を File（Blob） として保持している。
    そして createObjectURL はそのデータを参照するための一時URLを発行している。
    */
    // file（Blob）に対する一時的なローカルURL（blob:〜）を発行している
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
          if (!blob) {
            reject(new Error("圧縮に失敗しました"));
            return;
          }
          // BlobをFileに変換
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
    //ブラウザが画像の読み込み（デコード）【画像データが読み込まれると内部で JPEG → ピクセル配列へ展開（デコード）】
    img.src = url;
  });
};
