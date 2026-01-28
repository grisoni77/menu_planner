import { z } from "zod";

export const ShoppingItemSchema = z.object({
  item: z.string(),
  quantity: z.string(),
  reason: z.string().describe("Per quale ricetta serve"),
});

export const DayMenuSchema = z.object({
  day: z.enum(["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]),
  lunch: z.string().describe("Nome della ricetta scelta dal DB o idea semplice"),
  dinner: z.string().describe("Nome della ricetta scelta dal DB o idea semplice"),
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
