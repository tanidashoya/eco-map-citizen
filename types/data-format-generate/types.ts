/** Server Actionの統一戻り値 */
export type ActionResponse = {
  success: boolean;
  message: string;
  processedCount?: number;
};

/** user_inputシートの1行 */
export type UserInputRow = {
  timestamp: string;
  userName: string;
  userAddress: string;
  birthDate: string;
  imageUrls: string; // カンマ区切り
  comment: string;
};

/** formatted_dataシートの1行 */
export type FormattedDataRow = {
  originalId: string;
  userName: string;
  userAddress: string;
  birthDate: string;
  imageUrl: string; // 1URL
  comment: string;
  latitude: number | null;
  longitude: number | null;
  photoDateTime: string | null;
  address: string | null;
  processed: boolean;
};

/** merge_location_dataシートの1行 */
export type MergedLocationRow = {
  groupId: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  comments: string[];
  address: string;
  count: number;
};

/** KML生成用のポイントデータ */
export type MapPoint = {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
  comment?: string;
};
