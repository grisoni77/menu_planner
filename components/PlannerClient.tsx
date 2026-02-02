'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMenuAction } from "@/app/actions/menu-actions";
import { WeeklyPlan, DayMenu, ShoppingItem } from "@/types/weekly-plan";
import { Loader2, CheckCircle2 } from "lucide-react";
import { DayCard } from "./DayCard";

export default function PlannerClient() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateMenuAction(notes);
      if (result.success && result.plan) {
        // In a real app we might fetch the latest plan or use the returned one
        // The DB stores it as Json, we cast it here for UI
        setPlan({
          weekly_menu: result.plan.menu_data as DayMenu[],
          shopping_list: result.plan.shopping_list as ShoppingItem[],
          summary_note: result.plan.summary_note || "Menu generato con successo!",
        } as WeeklyPlan);
      } else {
        alert("Errore: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Si è verificato un errore durante la generazione.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Generatore Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Esempio: Venerdì ho ospiti a cena, evita il piccante..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generazione in corso...</> : "Genera Menu Settimanale"}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plan.weekly_menu.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista della Spesa</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                {plan.shopping_list.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 border-b pb-1">
                    <input type="checkbox" className="h-4 w-4" />
                    <span className="flex-1">
                      <span className="font-medium">{item.item}</span> ({item.quantity})
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground" title={item.recipe_ids.join(', ')}>
                      usato in {item.recipe_ids.length} ricett{item.recipe_ids.length === 1 ? 'a' : 'e'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
