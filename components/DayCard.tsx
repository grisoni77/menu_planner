import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { DayMenu } from "@/types/weekly-plan";
import { MealDisplay } from "./MealDisplay";

interface DayCardProps {
  day: DayMenu;
}

export function DayCard({ day }: DayCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{day.day}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-4 flex-1">
        <MealDisplay title="Pranzo" meal={day.lunch} />
        <MealDisplay title="Cena" meal={day.dinner} />
        
        {(day.lunch.ingredients_used_from_pantry.length > 0 || day.dinner.ingredients_used_from_pantry.length > 0) && (
          <div className="text-[11px] text-green-600 flex items-start gap-1 pt-2 border-t mt-auto">
            <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Usa: {[...new Set([...day.lunch.ingredients_used_from_pantry, ...day.dinner.ingredients_used_from_pantry])].join(', ')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
