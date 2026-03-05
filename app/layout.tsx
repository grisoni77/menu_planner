import Link from "next/link";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { signOutAction } from "@/app/actions/auth-actions";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.email?.replace('@app.local', '') ?? null;

  return (
    <html lang="it">
      <body className="antialiased">
        <nav className="border-b bg-muted/40 p-4 mb-8">
          <div className="container mx-auto flex gap-6 items-center">
            <span className="font-bold text-xl mr-4">AI Menu Planner</span>
            {user && (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:underline">Dispensa & Ricette</Link>
                <Link href="/planner" className="text-sm font-medium hover:underline">Generatore Menu</Link>
                <Link href="/history" className="text-sm font-medium hover:underline">Storico</Link>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{username}</span>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground"
                    >
                      Esci
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </nav>
        <main className="container mx-auto px-4 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
