import { createSupabaseServerClient } from "./server";
import { Point } from "@/types/maps";

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

/**
 * 承認済みのobservationsを取得し、Point型に変換する
 * マップ表示用（個人情報は含めない）
 */
export async function getApprovedObservations(): Promise<Point[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("observations")
    .select(
      "id, image_category, image_url, observer_name, comment, latitude, longitude, captured_at",
    )
    .eq("status", "approved")
    .order("captured_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch observations:", error);
    return [];
  }

  // Point型に変換
  return (data ?? []).map((obs) => ({
    uniqueId: obs.id,
    category: obs.image_category,
    imageUrl: obs.image_url,
    name: obs.observer_name,
    comment: obs.comment ?? undefined,
    lat: obs.latitude,
    lng: obs.longitude,
    shootingDate: obs.captured_at ?? "",
  }));
}

/**
 * 管理者用: 全てのobservationsを取得
 */
export async function getAllObservations(): Promise<Observation[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("observations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch all observations:", error);
    return [];
  }

  return data ?? [];
}
