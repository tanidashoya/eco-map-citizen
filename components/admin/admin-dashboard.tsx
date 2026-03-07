"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Observation } from "@/types/supabase";
import {
  updateObservationStatus,
  deleteObservation,
} from "@/app/actions/observations";
import { signOut } from "@/app/actions/auth";
import {
  Check,
  X,
  Trash2,
  LogOut,
  Loader2,
  Clock,
  MapPin,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "未確認", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済み", color: "bg-green-100 text-green-800" },
  rejected: { label: "却下済み", color: "bg-red-100 text-red-800" },
};

interface AdminDashboardProps {
  initialData: Observation[];
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // フィルタリング
  const filteredData =
    filter === "all"
      ? initialData
      : initialData.filter((obs) => obs.status === filter);

  // 承認
  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const result = await updateObservationStatus(id, "approved");
    if (result.success) {
      toast.success("マップに反映しました");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  };

  // 却下
  const handleReject = async (id: string) => {
    setLoadingId(id);
    const result = await updateObservationStatus(id, "rejected");
    if (result.success) {
      toast.success("却下しました");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  };

  // 削除
  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("このデータと画像を完全に削除しますか？")) return;
    setLoadingId(id);
    const result = await deleteObservation(id, imageUrl);
    if (result.success) {
      toast.success("削除しました");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setLoadingId(null);
  };

  // ログアウト
  const handleSignOut = async () => {
    await signOut();
  };

  // 日付フォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">管理ダッシュボード</h1>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* フィルター */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium">ステータス:</span>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">未確認</SelectItem>
              <SelectItem value="approved">承認済み</SelectItem>
              <SelectItem value="rejected">却下済み</SelectItem>
              <SelectItem value="all">すべて</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredData.length}件
          </span>
        </div>

        {/* データ一覧 */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            該当するデータがありません
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredData.map((obs) => (
              <div
                key={obs.id}
                className="bg-white rounded-lg border shadow-sm overflow-hidden"
              >
                {/* 画像 */}
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={obs.image_url}
                    alt="投稿画像"
                    fill
                    className="object-cover"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${
                      STATUS_LABELS[obs.status]?.color
                    }`}
                  >
                    {STATUS_LABELS[obs.status]?.label}
                  </span>
                </div>

                {/* 情報 */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {obs.image_category === "nature" ? "景観" : "生物"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="size-4" />
                    <span>{obs.observer_name}</span>
                  </div>

                  {obs.comment && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="size-4 mt-0.5 text-muted-foreground" />
                      <span className="line-clamp-2">{obs.comment}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    <span>
                      {obs.latitude.toFixed(5)}, {obs.longitude.toFixed(5)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>撮影: {formatDate(obs.captured_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>投稿: {formatDate(obs.created_at)}</span>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="p-4 pt-0 flex gap-2">
                  {obs.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      disabled={loadingId === obs.id}
                      onClick={() => handleApprove(obs.id)}
                    >
                      {loadingId === obs.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="size-4 mr-1" />
                          反映
                        </>
                      )}
                    </Button>
                  )}
                  {obs.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={loadingId === obs.id}
                      onClick={() => handleReject(obs.id)}
                    >
                      {loadingId === obs.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <X className="size-4 mr-1" />
                          却下
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={loadingId === obs.id}
                    onClick={() => handleDelete(obs.id, obs.image_url)}
                  >
                    {loadingId === obs.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
