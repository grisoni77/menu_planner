import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <h1 className="text-5xl font-extrabold tracking-tight">
        Pianifica i tuoi pasti con l'IA
      </h1>
      <p className="text-xl text-muted-foreground max-w-[600px]">
        Ottimizza la tua spesa, usa quello che hai in dispensa e scopri nuove ricette ogni settimana.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/planner">Inizia a pianificare</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Gestisci dispensa</Link>
        </Button>
      </div>
    </div>
  );
}
