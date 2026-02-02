export const PLANNER_CONFIG = {
  PROMPT_VERSION: 'planner-v2.0',
  MODEL_NAME: 'llama-3.3-70b-versatile',
  REQUIRED_NUTRITIONAL_CLASSES: ['veg', 'carbs', 'protein'] as const,
  MAX_RECIPE_FREQUENCY_PER_WEEK: 2,
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
