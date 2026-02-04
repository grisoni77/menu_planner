import { MealPlan, MealRecipeItem } from "@/types/weekly-plan";
import { Button as UIButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Home, Plus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MealEditorProps {
  title: string;
  meal: MealPlan;
  onChange: (updatedMeal: MealPlan) => void;
  onAddRecipe: () => void;
}

export function MealEditor({ title, meal, onChange, onAddRecipe }: MealEditorProps) {
  const isEatingOut = meal.recipes.length === 0;

  const toggleEatingOut = () => {
    if (isEatingOut) {
      onChange({ ...meal, recipes: [], notes: "" });
    } else {
      onChange({ ...meal, recipes: [], notes: "Pasto fuori casa" });
    }
  };

  const removeRecipe = (index: number) => {
    const newRecipes = [...meal.recipes];
    newRecipes.splice(index, 1);
    onChange({ ...meal, recipes: newRecipes });
  };

  return (
    <div className="space-y-2 border rounded-md p-3 bg-white shadow-sm">
      <div className="flex justify-between items-center border-b pb-1 mb-2">
        <span className="font-bold text-sm uppercase text-slate-600">{title}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <UIButton 
                variant={isEatingOut ? "default" : "outline"} 
                size="icon" 
                className="h-7 w-7" 
                onClick={toggleEatingOut}
              >
                <Home className="h-4 w-4" />
              </UIButton>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isEatingOut ? "Rimuovi pasto fuori casa" : "Imposta come pasto fuori casa"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isEatingOut ? (
        <div className="text-xs text-muted-foreground italic py-2 px-1 bg-slate-50 rounded border border-dashed flex items-center justify-center">
          Pasto fuori casa
        </div>
      ) : (
        <ul className="space-y-2">
          {meal.recipes.map((recipe, idx) => (
            <li key={idx} className="group relative flex flex-col p-2 bg-slate-50 rounded border border-slate-100">
              <div className="flex justify-between gap-2">
                <span className="text-xs font-semibold leading-tight pr-6">{recipe.name}</span>
                <UIButton 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-red-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeRecipe(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </UIButton>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                 <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 uppercase ${
                  recipe.meal_role === 'main' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50'
                }`}>
                  {recipe.meal_role}
                </Badge>
                {recipe.nutritional_classes.map(c => (
                  <Badge 
                    key={c} 
                    variant="secondary" 
                    className={`text-[8px] px-1 py-0 h-3.5 capitalize ${
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
          <UIButton 
            variant="ghost" 
            size="sm" 
            className="w-full h-8 border-dashed border-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1 text-[11px]"
            onClick={onAddRecipe}
          >
            <Plus className="h-3 w-3" /> Aggiungi ricetta
          </UIButton>
        </ul>
      )}
    </div>
  );
}
