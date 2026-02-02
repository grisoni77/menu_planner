import { getWeeklyPlansAction } from "@/app/actions/menu-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { DayMenu, ShoppingItem } from "@/types/weekly-plan";

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
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(plan.menu_data as DayMenu[]).map((day) => (
                  <Card key={day.day}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{day.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4">
                      <div>
                        <span className="font-bold block border-b mb-1">Pranzo:</span>
                        <ul className="space-y-1">
                          {/* @ts-ignore - Temporary bypass during Step 2 */}
                          <li className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                            <span className="font-semibold">Verdure:</span> {typeof day.lunch === 'string' ? day.lunch : (day.lunch as any).vegetables}
                          </li>
                          {typeof day.lunch !== 'string' && (
                            <>
                              <li className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                                <span className="font-semibold">Carboidrati:</span> {(day.lunch as any).carbs}
                              </li>
                              <li className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">
                                <span className="font-semibold">Proteine:</span> {(day.lunch as any).proteins}
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold block border-b mb-1">Cena:</span>
                        <ul className="space-y-1">
                          {/* @ts-ignore - Temporary bypass during Step 2 */}
                          <li className="text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs">
                            <span className="font-semibold">Verdure:</span> {typeof day.dinner === 'string' ? day.dinner : (day.dinner as any).vegetables}
                          </li>
                          {typeof day.dinner !== 'string' && (
                            <>
                              <li className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                                <span className="font-semibold">Carboidrati:</span> {(day.dinner as any).carbs}
                              </li>
                              <li className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">
                                <span className="font-semibold">Proteine:</span> {(day.dinner as any).proteins}
                              </li>
                            </>
                          )}
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
                    {(plan.shopping_list as ShoppingItem[]).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 border-b pb-1">
                        <span className="flex-1">
                          <span className="font-medium">{item.item}</span> ({item.quantity})
                        </span>
                        {/* @ts-ignore - Temporary bypass during Step 2 */}
                        <span className="text-xs text-muted-foreground italic">{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
