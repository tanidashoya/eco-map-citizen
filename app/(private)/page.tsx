import { getMapPoints } from "@/lib/google-api/google-api";
import MapWrapper from "@/components/MapWrapper";
import { Button } from "@/components/ui/button";

const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_GOOGLE_FORM_URL;

export default async function Home() {
  const points = await getMapPoints();

  return (
    <div className="h-screen flex flex-col">
      <header className="p-3 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-lg font-bold">環境マッピング</h1>
        <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">
          <Button className="bg-green-500 text-white border-none rounded-md cursor-pointer text-sm">
            <span>投稿する</span>
          </Button>
        </a>
      </header>
      <main className="flex-1">
        <MapWrapper points={points} />
      </main>
    </div>
  );
}
