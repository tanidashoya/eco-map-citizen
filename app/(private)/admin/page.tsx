import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllObservations } from "@/lib/supabase/queries";
import AdminDashboard from "@/components/admin/admin-dashboard";

// キャッシュを無効化し、常に最新データを取得
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  // 認証チェック
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/admin/login");
  }

  // 全データ取得（管理者なので全カラム）
  const observations = await getAllObservations();

  return <AdminDashboard initialData={observations} />;
}
