'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateMenuAction } from "@/app/actions/menu-actions";
import { WeeklyPlan, DayMenu, ShoppingItem } from "@/types/weekly-plan";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function PlannerClient() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);

  async function handleGenerate() {
    setLoading(true);
    const result = await generateMenuAction(notes);
    if (result.success && result.plan) {
      // In a real app we might fetch the latest plan or use the returned one
      // The DB stores it as Json, we cast it here for UI
      setPlan({
        weekly_menu: result.plan.menu_data as DayMenu[],
        shopping_list: result.plan.shopping_list as ShoppingItem[],
        summary_note: "Menu generato con successo!", // summary_note is not in DB schema but in AI output, let's fix action later if needed
      } as WeeklyPlan);
    } else {
      alert("Errore: " + result.error);
    }
    setLoading(false);
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
              <Card key={day.day}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{day.day}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-4">
                  <div>
                    <span className="font-bold block border-b mb-1">Pranzo:</span>
                    <ul className="space-y-1">
                      {day.lunch.recipes.map((recipe, idx) => (
                        <li key={idx} className="flex flex-col border-b border-green-100 last:border-0 pb-1 mb-1">
                          <span className="font-semibold text-green-900">{recipe.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {recipe.nutritional_classes.map(c => (
                              <span key={c} className="text-[10px] px-1 bg-green-100 text-green-700 rounded capitalize">{c}</span>
                            ))}
                            {recipe.source === 'ai' && (
                              <span className="text-[10px] px-1 bg-purple-100 text-purple-700 rounded">AI</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-bold block border-b mb-1">Cena:</span>
                    <ul className="space-y-1">
                      {day.dinner.recipes.map((recipe, idx) => (
                        <li key={idx} className="flex flex-col border-b border-blue-100 last:border-0 pb-1 mb-1">
                          <span className="font-semibold text-blue-900">{recipe.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {recipe.nutritional_classes.map(c => (
                              <span key={c} className="text-[10px] px-1 bg-blue-100 text-blue-700 rounded capitalize">{c}</span>
                            ))}
                            {recipe.source === 'ai' && (
                              <span className="text-[10px] px-1 bg-purple-100 text-purple-700 rounded">AI</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {day.ingredients_used_from_pantry.length > 0 && (
                    <div className="text-xs text-green-600 flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 mt-0.5" />
                      Usa: {day.ingredients_used_from_pantry.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista della Spesa</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 gap-2">
                {plan.shopping_list.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 border-b pb-1">
                    <input type="checkbox" className="h-4 w-4" />
                    <span className="flex-1">
                      <span className="font-medium">{item.item}</span> ({item.quantity})
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground">
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
