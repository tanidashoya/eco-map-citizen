"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { Leaf } from "lucide-react";

export default function Header() {
  return (
    <header className="absolute top-4 left-1/2 -translate-x-1/2 z-999 rounded-2xl h-16 px-4 flex justify-between items-center border shadow-md bg-white lg:w-[80%] w-[90%] lg:px-12">
      <div className="flex items-center gap-2">
        <Leaf className="text-green-500 size-6" />
        <h1 className="text-lg font-bold">環境マップ</h1>
      </div>
      <Link href="/submit">
        <Button className="bg-green-500 text-white border-none rounded-md cursor-pointer text-sm hover:bg-green-600 shadow-md">
          <span>投稿する</span>
        </Button>
      </Link>
    </header>
  );
}
