import { z } from "zod";

export const NutritionalClassEnum = z.enum(['veg', 'carbs', 'protein']);
export type NutritionalClass = z.infer<typeof NutritionalClassEnum>;

export const MealRoleEnum = z.enum(['main', 'side']);
export type MealRole = z.infer<typeof MealRoleEnum>;

export const RecipeSourceEnum = z.enum(['user', 'ai']);
export type RecipeSource = z.infer<typeof RecipeSourceEnum>;

export const SeasonEnum = z.enum(['Primavera', 'Estate', 'Autunno', 'Inverno']);
export type Season = z.infer<typeof SeasonEnum>;

export const MealRecipeItemSchema = z.object({
  recipe_id: z.string().describe("ID della ricetta nel database. Se è una nuova ricetta AI, lascia vuoto o metti 'new'."),
  name: z.string(),
  meal_role: MealRoleEnum,
  nutritional_classes: z.array(NutritionalClassEnum).min(1),
  source: RecipeSourceEnum,
  ai_creation_data: z.object({
    ingredients: z.array(z.string()),
    tags: z.array(z.string()),
  }).nullable().optional().describe("Dati per creare la ricetta se source è 'ai'"),
});
export type MealRecipeItem = z.infer<typeof MealRecipeItemSchema>;

export const MealPlanSchema = z.object({
  recipes: z.array(MealRecipeItemSchema),
  notes: z.string().nullable().optional(),
  ingredients_used_from_pantry: z.array(z.string()),
});
export type MealPlan = z.infer<typeof MealPlanSchema>;

export const ShoppingItemSchema = z.object({
  item: z.string(),
  quantity: z.string(),
  recipe_ids: z.array(z.string()).min(1).describe("ID delle ricette che richiedono questo ingrediente"),
});
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

export const DayMenuSchema = z.object({
  day: z.enum(["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]),
  lunch: MealPlanSchema,
  dinner: MealPlanSchema,
});
export type DayMenu = z.infer<typeof DayMenuSchema>;

export const WeeklyPlanSchema = z.object({
  weekly_menu: z.array(DayMenuSchema),
  summary_note: z.string().describe("Breve commento dell'AI sul menu creato"),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

export const WeeklyPlanDraftSchema = z.object({
  draft_version: z.literal(1),
  saved_at: z.string(), // ISO string
  notes: z.string(), // Le note originali dell'utente
  weekly_menu: z.array(DayMenuSchema),
  summary_note: z.string(),
  model_name: z.string().optional(),
  generation_prompt_version: z.string().optional(),
});

export type WeeklyPlanDraft = z.infer<typeof WeeklyPlanDraftSchema>;
