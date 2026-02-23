import { Toaster } from "sonner";

export default function SubmitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // min-h-dvhはビューポートの高さを最小にする(min-height: 100dvh の略)
    //min-h-dvh — この要素は最低でも画面の高さいっぱいになる。中身が少なくても画面全体が背景色で埋まる。中身が多ければスクロールして伸びる
    <>
      <main className="min-h-dvh bg-background">
        {children}
        <Toaster position="top-center" />
      </main>
    </>
  );
}
