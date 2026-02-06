'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateMenuAction, saveWeeklyPlanAction } from "@/app/actions/menu-actions";
import { DayMenu, ShoppingItem, MealRecipeItem, MealPlan } from "@/types/weekly-plan";
import { Loader2, CheckCircle2, Download, Trash2, Save, X, AlertTriangle, Info } from "lucide-react";
import { DayCard } from "./DayCard";
import { ExportButton } from "./ExportButton";
import { useLocalStorageDraft } from "@/lib/use-local-storage-draft";
import { MealEditor } from "./MealEditor";
import { RecipePickerDialog } from "./RecipePickerDialog";
import { checkCoverage } from "@/lib/planner-utils";
import { Badge } from "./ui/badge";

type SavedPlan = {
  weekly_menu: DayMenu[];
  shopping_list: ShoppingItem[];
  summary_note: string;
  model_name?: string;
};

export default function PlannerClient() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<SavedPlan | null>(null);

  const { draft, setDraft, clearDraft, isReady } = useLocalStorageDraft('menu_planner:draft_weekly_plan:v1');

  // State for recipe picker
  const [pickerConfig, setPickerConfig] = useState<{
    day: string;
    mealKey: 'lunch' | 'dinner';
    mealRole: 'main' | 'side';
  } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateMenuAction(notes);
      if (result.success && result.draft) {
        setDraft({
          draft_version: 1,
          saved_at: new Date().toISOString(),
          notes: notes,
          weekly_menu: result.draft.weekly_menu as DayMenu[],
          summary_note: result.draft.summary_note,
          model_name: result.draft.model_name,
          generation_prompt_version: result.draft.generation_prompt_version,
        });
        setPlan(null); // Clear previous saved plan if any
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

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const result = await saveWeeklyPlanAction(draft);
      if (result.success && result.plan) {
        setPlan({
          weekly_menu: result.plan.menu_data as DayMenu[],
          shopping_list: result.plan.shopping_list as ShoppingItem[],
          summary_note: "Piano salvato con successo!",
          model_name: result.plan.model_name
        } as SavedPlan);
        clearDraft();
        alert("Piano salvato con successo!");
      } else {
        alert("Errore durante il salvataggio: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  }

  const updateDraftMeal = (dayName: string, mealKey: 'lunch' | 'dinner', updatedMeal: MealPlan) => {
    if (!draft) return;
    const newMenu = draft.weekly_menu.map(d => 
      d.day === dayName ? { ...d, [mealKey]: { ...updatedMeal, ingredients_used_from_pantry: updatedMeal.ingredients_used_from_pantry || [] } } : d
    );
    setDraft({ ...draft, weekly_menu: newMenu });
  };

  const handleAddRecipe = (day: string, mealKey: 'lunch' | 'dinner', mealRole: 'main' | 'side') => {
    setPickerConfig({ day, mealKey, mealRole });
  };

  const onRecipeSelect = (recipe: MealRecipeItem) => {
    if (!draft || !pickerConfig) return;
    const { day, mealKey } = pickerConfig;
    const dayData = draft.weekly_menu.find(d => d.day === day);
    if (!dayData) return;

    const currentMeal = dayData[mealKey];
    const newRecipes = [...currentMeal.recipes, recipe];
    
    updateDraftMeal(day, mealKey, { ...currentMeal, recipes: newRecipes });
    setPickerConfig(null);
  };

  // Validation
  const getValidationErrors = () => {
    if (!draft) return [];
    const errors: string[] = [];
    draft.weekly_menu.forEach(day => {
      (['lunch', 'dinner'] as const).forEach(mealKey => {
        const meal = day[mealKey];
        if (meal.recipes.length === 0) {
          if (!meal.notes?.toLowerCase().includes("pasto fuori casa")) {
            errors.push(`${day.day} (${mealKey === 'lunch' ? 'Pranzo' : 'Cena'}): Seleziona ricette o imposta "Pasto fuori casa"`);
          }
        } else {
          const classes = meal.recipes.flatMap(r => r.nutritional_classes);
          const { isComplete, missingClasses } = checkCoverage(classes);
          if (!isComplete) {
            errors.push(`${day.day} (${mealKey === 'lunch' ? 'Pranzo' : 'Cena'}): Mancano ${missingClasses.join(', ')}`);
          }
        }
      });
    });
    return errors;
  };

  const validationErrors = getValidationErrors();
  const isValid = validationErrors.length === 0;

  if (!isReady) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Input Section */}
      {!draft && (
        <Card>
          <CardHeader>
            <CardTitle>Generatore Menu</CardTitle>
            <CardDescription>Inserisci le tue preferenze per la settimana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Esempio: Venerdì ho ospiti a cena, evita il piccante..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={handleGenerate} disabled={loading} className="w-full h-12 text-lg">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generazione in corso...</> : "Genera Menu Settimanale"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Draft Section */}
      {draft && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div>
              <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <Info className="h-5 w-5" /> Revisione Bozza
              </h2>
              <p className="text-sm text-amber-700">Modifica il menu prima di salvarlo definitivamente.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={clearDraft} className="flex-1 md:flex-none">
                <X className="mr-2 h-4 w-4" /> Scarta
              </Button>
              <Button onClick={handleSave} disabled={!isValid || saving} className="flex-1 md:flex-none">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salva Piano
              </Button>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" /> Errori di validazione:
              </h3>
              <ul className="text-xs text-red-700 list-disc pl-5 space-y-1">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {draft.summary_note && (
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="pt-6">
                <p className="text-sm italic text-slate-600">"{draft.summary_note}"</p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {draft.weekly_menu.map((day) => (
              <div key={day.day} className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-1">{day.day}</h3>
                <MealEditor 
                  title="Pranzo" 
                  meal={day.lunch} 
                  onChange={(m) => updateDraftMeal(day.day, 'lunch', m)}
                  onAddRecipe={(role) => handleAddRecipe(day.day, 'lunch', role)}
                />
                <MealEditor 
                  title="Cena" 
                  meal={day.dinner} 
                  onChange={(m) => updateDraftMeal(day.day, 'dinner', m)}
                  onAddRecipe={(role) => handleAddRecipe(day.day, 'dinner', role)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Plan Section */}
      {plan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-green-50 p-6 rounded-xl border-2 border-green-200">
            <div>
              <h2 className="text-3xl font-black text-green-900">Menu Salvato! 🎉</h2>
              <p className="text-green-700">Il tuo piano settimanale è pronto.</p>
            </div>
            <div className="flex gap-3">
              <ExportButton 
                data={[plan]} 
                filename="piano-settimanale.md" 
                type="weekly-plan" 
                label="Esporta Piano (MD)"
              />
              <Button variant="outline" onClick={() => setPlan(null)}>Crea Nuovo</Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plan.weekly_menu.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>

          <Card className="shadow-lg border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-slate-50/50">
              <CardTitle className="text-xl">Lista della Spesa Ricalcolata</CardTitle>
              {plan.model_name && (
                <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                  Model: {plan.model_name}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {plan.shopping_list.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-2 rounded-lg border bg-white hover:border-slate-300 transition-colors">
                    <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.item}</p>
                      <p className="text-xs text-slate-500">{item.quantity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recipe Picker Dialog */}
      {pickerConfig && (
        <RecipePickerDialog 
          isOpen={!!pickerConfig}
          onClose={() => setPickerConfig(null)}
          onSelect={onRecipeSelect}
          mealRole={pickerConfig.mealRole}
        />
      )}
    </div>
  );
}
