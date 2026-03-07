//サーバー側のクライアントを使ってsupabaseのデータを取得する
import { createSupabaseServerClient } from "./server";
import { Point } from "@/types/maps";
import { Observation } from "@/types/supabase";

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
    .eq("status", "approved") //承認済みのobservationsを取得
    .order("captured_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch observations:", error);
    // エラーをthrowしてerror.tsxでエラー画面を表示
    throw new Error("マップデータの取得に失敗しました");
  }

  // Point型に変換
  return (data ?? []).map((obs) => ({
    uniqueId: obs.id,
    category: obs.image_category,
    imageUrl: obs.image_url,
    name: obs.observer_name ?? "",
    comment: obs.comment ?? "",
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
    // エラーをthrowしてerror.tsxでエラー画面を表示
    throw new Error("データの取得に失敗しました");
  }

  return data ?? [];
}
