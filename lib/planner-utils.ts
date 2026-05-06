import type { MealRecipeItem } from "@/types/weekly-plan";

export const PLANNER_CONFIG = {
  PROMPT_VERSION: 'planner-v2.2',
  REQUIRED_NUTRITIONAL_CLASSES: ['veg', 'carbs', 'protein'] as const,
  MAX_RECIPE_FREQUENCY_PER_WEEK: 2,
  GENERIC_FALLBACKS: {
    veg: [
      'Verdure di stagione al vapore',
      'Insalata mista fresca',
      'Verdure grigliate (zucchine e melanzane)'
    ],
    carbs: [
      'Pane integrale di accompagnamento',
      'Gallette di riso o mais',
      'Patate lesse velocissime'
    ],
    protein: [
      'Uovo sodo',
      'Fiocchi di latte o formaggio magro',
      'Legumi rapidi'
    ]
  }
};

/**
 * Normalizza il nome di una ricetta per il dedup e la ricerca.
 * Trim, lower case, e collassa gli spazi multipli.
 */
export function normalizeRecipeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Verifica se un set di classi nutrizionali copre i requisiti minimi.
 */
export function checkCoverage(nutritionalClasses: string[]): {
  isComplete: boolean;
  missingClasses: string[];
} {
  const missing = PLANNER_CONFIG.REQUIRED_NUTRITIONAL_CLASSES.filter(
    (cls) => !nutritionalClasses.includes(cls)
  );
  return {
    isComplete: missing.length === 0,
    missingClasses: missing,
  };
}

/**
 * Ordina i piatti di un pasto: prima i 'main', poi i 'side',
 * secondario alfabetico (locale italiano).
 */
export function compareMealRecipes(a: MealRecipeItem, b: MealRecipeItem): number {
  if (a.meal_role !== b.meal_role) {
    return a.meal_role === 'main' ? -1 : 1;
  }
  return a.name.localeCompare(b.name, 'it');
}
