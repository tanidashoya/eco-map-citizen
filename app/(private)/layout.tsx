import { Toaster } from "sonner";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="w-screen h-screen">
        {children}
        {/* <Toaster position="top-center" /> */}
      </main>
    </>
  );
}
