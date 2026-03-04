// components/location/location-status-badge.tsx
//
// 役割: 位置情報の取得状態を表示するバッジコンポーネント

import { LocationStatusBadgeProps } from "@/types/form/index";
import { Loader2, MapPin, AlertTriangle } from "lucide-react";

export function LocationStatusBadge({ status }: LocationStatusBadgeProps) {
  switch (status) {
    case "loading":
      return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span>位置情報を取得中...</span>
        </div>
      );
    case "ready":
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <MapPin className="size-3" />
          <span>位置情報OK</span>
        </div>
      );
    case "denied":
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="size-3" />
          <span>位置情報の許可が必要です</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertTriangle className="size-3" />
          <span>位置情報を取得できません</span>
        </div>
      );
  }
}
