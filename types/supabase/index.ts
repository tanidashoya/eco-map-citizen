/**
 * Supabase observations テーブルの行の型
 */
export interface Observation {
  id: string;
  created_at: string;
  image_category: string;
  image_url: string;
  observer_name: string;
  observer_area: string | null;
  observer_birth_date: string | null;
  comment: string | null;
  latitude: number;
  longitude: number;
  captured_at: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
}
