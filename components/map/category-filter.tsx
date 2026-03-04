"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mountain, Leaf, MapPin } from "lucide-react";

// カテゴリの型定義
export type CategoryFilterValue = "all" | "nature" | "animal";

// カテゴリの選択肢
const CATEGORY_OPTIONS: {
  value: CategoryFilterValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "すべての地点", icon: MapPin },
  { value: "nature", label: "景観", icon: Mountain },
  { value: "animal", label: "生物", icon: Leaf },
];

interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export default function CategoryFilter({
  value,
  onChange,
}: CategoryFilterProps) {
  // const selectedOption = CATEGORY_OPTIONS.find((opt) => opt.value === value);
  // const Icon = selectedOption?.icon ?? MapPin;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-fit bg-white shadow-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={false}
      >
        {CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <option.icon className="size-4" />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
