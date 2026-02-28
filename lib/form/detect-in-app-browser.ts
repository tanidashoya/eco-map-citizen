/**
 * アプリ内ブラウザ（LINE, Instagram, Facebook等）を検出
 * これらのブラウザではcapture属性が正しく動作しない場合がある
 */
export const isInAppBrowser = (): boolean => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent;

  // LINE, Facebook, Instagram, Twitter等のアプリ内ブラウザを検出
  const inAppPatterns = [
    /Line/i, // LINE
    /FBAN/i, // Facebook
    /FBAV/i, // Facebook
    /Instagram/i, // Instagram
    /Twitter/i, // Twitter/X
    /MicroMessenger/i, // WeChat
  ];

  return inAppPatterns.some((pattern) => pattern.test(ua));
};

/**
 * 検出されたアプリ名を返す
 */
export const getInAppBrowserName = (): string | null => {
  if (typeof navigator === "undefined") return null;

  const ua = navigator.userAgent;

  if (/Line/i.test(ua)) return "LINE";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Twitter/i.test(ua)) return "X (Twitter)";
  if (/MicroMessenger/i.test(ua)) return "WeChat";

  return null;
};
