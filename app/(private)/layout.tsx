import { Toaster } from "sonner";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="w-screen h-screen">
        <Toaster position="top-center" />
        {children}
      </main>
    </>
  );
}
