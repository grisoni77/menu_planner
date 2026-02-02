import { getWeeklyPlansAction } from "@/app/actions/menu-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DayMenu, ShoppingItem } from "@/types/weekly-plan";
import { DayCard } from "@/components/DayCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function isV2Plan(plan: any): boolean {
  if (!plan.menu_data || !Array.isArray(plan.menu_data) || plan.menu_data.length === 0) return false;
  const firstDay = plan.menu_data[0];
  // In V2, lunch and dinner are objects with a 'recipes' array
  return firstDay.lunch && typeof firstDay.lunch === 'object' && Array.isArray(firstDay.lunch.recipes);
}

export default async function HistoryPage() {
  const result = await getWeeklyPlansAction();

  if (!result.success) {
    return <div>Errore: {result.error}</div>;
  }

  const plans = result.plans || [];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Storico Menu</h1>
      {plans.length === 0 ? (
        <p>Nessun menu salvato.</p>
      ) : (
        <div className="space-y-12">
          {plans.map((plan: any) => (
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
              </div>
              
              {!isV2Plan(plan) ? (
                <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Versione precedente</AlertTitle>
                  <AlertDescription>
                    Questo piano è stato generato con una versione precedente del planner e non può essere visualizzato correttamente.
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
