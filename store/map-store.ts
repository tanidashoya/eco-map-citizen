import { atomWithStorage } from "jotai/utils";

// 初期位置のキャッシュ（ローカルストレージに保存し、リロード時もローディングを表示しない）
export const cachedCenterAtom = atomWithStorage<[number, number] | null>(
  "map-cached-center",
  null,
);
