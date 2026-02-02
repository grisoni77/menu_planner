'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu, ShoppingItem } from "@/types/weekly-plan";
import { DayCard } from "@/components/DayCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { ImportWeeklyPlansModal } from "@/components/ImportWeeklyPlansModal";

interface HistoryClientProps {
  initialPlans: any[];
}

function isV2Plan(plan: any): boolean {
  if (!plan.menu_data || !Array.isArray(plan.menu_data) || plan.menu_data.length === 0) return false;
  const firstDay = plan.menu_data[0];
  return firstDay && typeof firstDay === 'object' && 
         firstDay.lunch && typeof firstDay.lunch === 'object' && 
         Array.isArray(firstDay.lunch.recipes);
}

export function HistoryClient({ initialPlans }: HistoryClientProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Storico Menu</h1>
        <div className="flex gap-2">
          <ExportButton 
            data={initialPlans} 
            filename="storico-menu.json" 
            type="weekly-plans-history" 
            label="Esporta Storico (JSON)"
          />
          <ImportWeeklyPlansModal />
        </div>
      </div>

      {initialPlans.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nessun menu salvato.</p>
      ) : (
        <div className="space-y-12">
          {initialPlans.map((plan: any) => (
            <div key={plan.id} className="space-y-4 border-t pt-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Menu del {new Date(plan.created_at).toLocaleDateString('it-IT', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </h2>
                {plan.model_name && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Model: {plan.model_name}
                  </span>
                )}
              </div>
              
              {!isV2Plan(plan) ? (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Versione precedente</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Questo piano è stato generato con una versione precedente del planner e non può essere visualizzato correttamente con la nuova interfaccia.</p>
                    <div className="text-[10px] opacity-70 font-mono mt-2 p-2 bg-white/50 rounded overflow-auto max-h-40">
                      {JSON.stringify(plan.menu_data, null, 2)}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(plan.menu_data as DayMenu[]).map((day) => (
                      <DayCard key={day.day} day={day} />
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lista della Spesa</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(plan.shopping_list as ShoppingItem[]).map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 border-b pb-1 text-sm">
                            <span className="flex-1">
                              <span className="font-medium">{item.item}</span> ({item.quantity})
                            </span>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-muted-foreground" title={item.recipe_ids?.join(', ')}>
                              usato in {item.recipe_ids?.length || 0} ricett{(item.recipe_ids?.length || 0) === 1 ? 'a' : 'e'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
