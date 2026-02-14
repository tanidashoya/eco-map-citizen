import { Toaster } from "sonner";

export default function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <main className="max-w-7xl mx-auto lg:mt-8 flex flex-col justify-center items-center h-[calc(100vh-80px)] w-full">
        {children}
        <Toaster />
      </main>
    </>
  );
}
