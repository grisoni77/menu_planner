import Link from "next/link";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        <nav className="border-b bg-muted/40 mb-8 sticky top-0 z-50 backdrop-blur-sm">
          <div className="container mx-auto px-4 flex h-14 items-center justify-between">
            <span className="font-bold text-lg sm:text-xl shrink-0">AI Menu Planner</span>
            <div className="flex gap-4 sm:gap-6 items-center overflow-x-auto no-scrollbar py-2">
              <Link href="/dashboard" className="text-sm font-medium hover:underline whitespace-nowrap">Dashboard</Link>
              <Link href="/planner" className="text-sm font-medium hover:underline whitespace-nowrap">Planner</Link>
              <Link href="/history" className="text-sm font-medium hover:underline whitespace-nowrap">Storico</Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
