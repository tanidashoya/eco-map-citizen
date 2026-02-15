/**
 * Google Drive URLを表示可能な形式に変換
 * クライアント/サーバー両方で使用可能
 */

// URLからファイルIDを抽出
function extractFileId(url: string): string | null {
  // ?id=xxx 形式
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // /d/xxx 形式
  match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return null;
}

// Google Drive URLを表示可能な形式に変換
export function convertDriveUrl(
  driveUrl: string | undefined,
): string | undefined {
  if (!driveUrl) return undefined;

  // 既にlh3形式の場合はそのまま返す
  if (driveUrl.includes("lh3.googleusercontent.com")) {
    return driveUrl;
  }

  const fileId = extractFileId(driveUrl);
  if (fileId) {
    // lh3.googleusercontent.com 形式（より安定して表示可能）
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return driveUrl;
}
