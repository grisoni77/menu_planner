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
        <nav className="border-b bg-muted/40 p-4 mb-8">
          <div className="container mx-auto flex gap-6 items-center">
            <span className="font-bold text-xl mr-4">AI Menu Planner</span>
            <Link href="/dashboard" className="text-sm font-medium hover:underline">Dispensa & Ricette</Link>
            <Link href="/planner" className="text-sm font-medium hover:underline">Generatore Menu</Link>
            <Link href="/history" className="text-sm font-medium hover:underline">Storico</Link>
          </div>
        </nav>
        <main className="container mx-auto px-4 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
