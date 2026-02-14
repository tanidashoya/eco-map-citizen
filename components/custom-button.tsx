"use client";
import { Button } from "@/components/ui/button";
import { CustomButtonProps } from "@/types";

export default function CustomButton({
  icon,
  text,
  className,
  onClick,
}: CustomButtonProps) {
  return (
    <Button className={className} onClick={onClick}>
      <span className="text-lg font-medium">{icon}</span>
      <span className="text-lg font-medium">{text}</span>
    </Button>
  );
}
