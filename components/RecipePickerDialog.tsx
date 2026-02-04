import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2 } from "lucide-react";
import { getRecipesAction } from "@/app/actions/menu-actions";
import { MealRecipeItem } from "@/types/weekly-plan";

interface RecipePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: MealRecipeItem) => void;
  mealRole: 'main' | 'side';
}

export function RecipePickerDialog({ isOpen, onClose, onSelect, mealRole }: RecipePickerDialogProps) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen]);

  async function loadRecipes() {
    setLoading(true);
    const result = await getRecipesAction();
    if (result.success && result.data) {
      setRecipes(result.data);
    }
    setLoading(false);
  }

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = r.meal_role === mealRole;
    return matchesSearch && matchesRole;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Scegli una ricetta ({mealRole})</DialogTitle>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca ricetta..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex flex-col p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelect({
                      recipe_id: recipe.id,
                      name: recipe.name,
                      meal_role: recipe.meal_role,
                      nutritional_classes: recipe.nutritional_classes,
                      source: 'user'
                    });
                    onClose();
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{recipe.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recipe.nutritional_classes.map((c: string) => (
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              Nessuna ricetta trovata.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
