export function convertToViewableUrl(url: string): string {
  // 既にlh3形式ならそのまま返す
  if (url.includes("lh3.googleusercontent.com")) {
    return url;
  }

  // ファイルIDを抽出
  let fileId: string | null = null;

  // ?id=xxx 形式
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    fileId = idMatch[1];
  }

  // /d/xxx 形式
  if (!fileId) {
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) {
      fileId = dMatch[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 変換できない場合は元のURLを返す
  return url;
}
