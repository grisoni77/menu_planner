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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2, Plus, ArrowLeft } from "lucide-react";
import { getRecipesAction } from "@/app/actions/menu-actions";
import { MealRecipeItem, NutritionalClass } from "@/types/weekly-plan";

interface RecipePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recipe: MealRecipeItem) => void;
  mealRole: 'main' | 'side';
}

const NUTRITIONAL_CLASSES: { value: NutritionalClass; label: string }[] = [
  { value: 'veg', label: 'Verdura (Veg)' },
  { value: 'carbs', label: 'Carboidrati' },
  { value: 'protein', label: 'Proteine' },
];

export function RecipePickerDialog({ isOpen, onClose, onSelect, mealRole }: RecipePickerDialogProps) {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<'search' | 'create'>('search');
  const [createName, setCreateName] = useState("");
  const [createIngredients, setCreateIngredients] = useState("");
  const [createClasses, setCreateClasses] = useState<NutritionalClass[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setView('search');
      setSearch("");
      setCreateName("");
      setCreateIngredients("");
      setCreateClasses([]);
      setCreateError(null);
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

  function handleCreateSubmit() {
    setCreateError(null);
    const name = createName.trim();
    if (!name) {
      setCreateError("Il nome è obbligatorio.");
      return;
    }
    if (createClasses.length === 0) {
      setCreateError("Seleziona almeno una classe nutrizionale.");
      return;
    }
    const ingredients = createIngredients
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (ingredients.length === 0) {
      setCreateError("Inserisci almeno un ingrediente.");
      return;
    }

    onSelect({
      recipe_id: 'new',
      name,
      meal_role: mealRole,
      nutritional_classes: createClasses,
      source: 'user',
      ai_creation_data: {
        ingredients,
        tags: [],
      },
    });
    onClose();
  }

  function toggleCreateClass(cls: NutritionalClass) {
    setCreateClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {view === 'search'
                ? `Scegli una ricetta (${mealRole})`
                : `Crea nuova ricetta (${mealRole})`}
            </DialogTitle>
            {view === 'search' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setView('create')}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Crea nuova
              </Button>
            )}
            {view === 'create' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView('search')}
                className="gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Torna alla ricerca
              </Button>
            )}
          </div>
        </DialogHeader>

        {view === 'search' ? (
          <>
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
                          source: 'user',
                          ai_creation_data: null,
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
          </>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
            {createError && (
              <div className="text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
                {createError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="create-name" className="text-sm font-medium">Nome ricetta</label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="es. Pasta alla Carbonara"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Classi Nutrizionali</label>
              <div className="flex flex-col gap-2 border rounded-md p-3">
                {NUTRITIONAL_CLASSES.map((cls) => (
                  <div key={cls.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-class-${cls.value}`}
                      checked={createClasses.includes(cls.value)}
                      onCheckedChange={() => toggleCreateClass(cls.value)}
                    />
                    <label
                      htmlFor={`create-class-${cls.value}`}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {cls.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="create-ingredients" className="text-sm font-medium">
                Ingredienti (separati da virgola)
              </label>
              <Input
                id="create-ingredients"
                value={createIngredients}
                onChange={(e) => setCreateIngredients(e.target.value)}
                placeholder="es. Pasta, Uova, Guanciale"
              />
            </div>

            <Button onClick={handleCreateSubmit} className="w-full">
              Aggiungi al pasto
            </Button>

            <p className="text-[11px] text-muted-foreground italic">
              Questa ricetta resta in bozza finché non salvi il menu. Tag e stagionalità si possono completare dal Dashboard dopo il salvataggio.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
