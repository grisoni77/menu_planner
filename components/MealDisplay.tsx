import { MealPlan, NutritionalClass } from "@/types/weekly-plan";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MealDisplayProps {
  title: string;
  meal: MealPlan;
  className?: string;
}

export function MealDisplay({ title, meal, className = "" }: MealDisplayProps) {
  const classesCovered = new Set<NutritionalClass>();
  meal.recipes.forEach(r => {
    r.nutritional_classes.forEach(c => classesCovered.add(c));
  });

  const missingClasses = (['veg', 'carbs', 'protein'] as NutritionalClass[]).filter(
    c => !classesCovered.has(c)
  );

  // Ordina le ricette: prima i 'main', poi i 'side'
  const sortedRecipes = [...meal.recipes].sort((a, b) => {
    if (a.meal_role === 'main' && b.meal_role !== 'main') return -1;
    if (a.meal_role !== 'main' && b.meal_role === 'main') return 1;
    return 0;
  });

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center border-b pb-1">
        <span className="font-bold block capitalize">{title}:</span>
        {missingClasses.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Mancano: {missingClasses.join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <ul className="space-y-2">
        {sortedRecipes.map((recipe, idx) => (
          <li key={idx} className="flex flex-col space-y-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold leading-tight">{recipe.name}</span>
              {recipe.source === 'ai' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="h-3 w-3 text-purple-500 flex-shrink-0 mt-1 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generata da AI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase bg-slate-50">
                {recipe.meal_role}
              </Badge>
              {recipe.nutritional_classes.map(c => (
                <Badge 
                  key={c} 
                  variant="secondary" 
                  className={`text-[9px] px-1 py-0 h-4 capitalize ${
                    c === 'veg' ? 'bg-green-100 text-green-700' : 
                    c === 'carbs' ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {missingClasses.length > 0 && (
        <p className="text-[10px] text-amber-600 italic">
          ⚠️ Copertura incompleta: {missingClasses.join(', ')}
        </p>
      )}
    </div>
  );
}
