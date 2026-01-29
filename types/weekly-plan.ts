import { z } from "zod";

export const ShoppingItemSchema = z.object({
  item: z.string(),
  quantity: z.string(),
  reason: z.string().describe("Per quale ricetta serve"),
});

export const MealSchema = z.object({
  vegetables: z.string().describe("Componente verdura (50%)"),
  carbs: z.string().describe("Componente carboidrati (30%)"),
  proteins: z.string().describe("Componente proteine (20%)"),
});

export const DayMenuSchema = z.object({
  day: z.enum(["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]),
  lunch: z.union([z.string(), MealSchema]),
  dinner: z.union([z.string(), MealSchema]),
  ingredients_used_from_pantry: z.array(z.string()),
});

export const WeeklyPlanSchema = z.object({
  weekly_menu: z.array(DayMenuSchema),
  shopping_list: z.array(ShoppingItemSchema),
  summary_note: z.string().describe("Breve commento dell'AI sul menu creato"),
});

export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type DayMenu = z.infer<typeof DayMenuSchema>;
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
