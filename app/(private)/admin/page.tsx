"use client";
import { Locate, Loader2 } from "lucide-react";
import CustomButton from "@/components/form/custom-button";
import { ActionDataFormmatLocate } from "@/app/actions/action-data-format";
// import { kmlMergeLocate } from "@/app/actions/action-kml-merge-locate";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const [logMessages, setLogMessages] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleDataFormmatLocate = async () => {
    setLogMessages("マップに反映しています...");
    setIsLoading(true);
    const result = await ActionDataFormmatLocate();
    if (result?.success) {
      setLogMessages(`${result.message}`);
    } else {
      setLogMessages(`${result?.message}`);
      toast.error(result?.message);
    }
    setIsLoading(false);
  };
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full mb-8 lg:mb-12">
        <h1 className="text-xl font-bold lg:font-medium lg:text-2xl text-gray-600 text-center">
          環境マッピング管理者画面
        </h1>
      </div>
      <div className="w-full mb-8 lg:mb-12">
        <div className="h-[170px] lg:h-[200px] lg:w-[500px] w-[300px] bg-gray-100 border border-gray-300 rounded-md shadow-md text-center flex items-center justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="size-8 animate-spin text-green-500" />
              <span className="text-lg font-medium">{logMessages}</span>
            </div>
          ) : (
            <span className="text-lg font-medium">{logMessages}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <CustomButton
            icon={<Locate className="size-5" />}
            text="マップに反映"
            className="w-[200px] h-[50px] lg:w-[220px] lg:h-[55px] bg-green-500 text-white shadow-md hover:bg-green-600 transition-all duration-300 cursor-pointer"
            onClick={handleDataFormmatLocate}
          />
          <span className="text-sm font-medium text-center text-gray-400">
            ※マップに反映させる前にドライブに保存した画像の確認をしてください。
          </span>
        </div>
        {/* <div>
          <ArrowDown
            size={40}
            strokeWidth={2.0}
            className="text-blue-500 animate-bounce"
          />
        </div> */}
        {/* <div className="flex flex-col items-center justify-center gap-2">
          <CustomButton
            icon={<MapPin className="size-5 " />}
            text="MyMap用データ出力"
            className="w-[220px] h-[50px] lg:w-[240px] lg:h-[55px] bg-green-500 text-white shadow-md hover:bg-green-600 transition-all duration-300 cursor-pointer"
            onClick={async () => {
              const result = await kmlMergeLocate();
              if (result.success && result.downloadUrl) {
                const a = document.createElement("a");
                a.href = result.downloadUrl;
                a.download = "";
                a.click();
              }
            }}
          />
          <span className="text-sm font-medium text-center text-gray-400">
            ※MyMapインポート用のklmデータ出力
          </span>
        </div> */}
      </div>
    </div>
  );
}
