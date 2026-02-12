# Prompt Changelog — Menu Planner

Ogni modifica al prompt di generazione menu deve:
1. Incrementare `PROMPT_VERSION` in `lib/planner-utils.ts`
2. Aggiungere una voce in questo file

---

## v2.1 — Stagionalità rigorosa

**Commit**: `8e3290f`
**Data**: 2026-02-12
**File modificati**: `app/actions/menu-actions.ts`

### Modifiche
- Aggiunta rilevazione automatica della stagione corrente dal clock di sistema
- Aggiunta sezione `STAGIONE CORRENTE` nel prompt
- Aggiunte regole `STAGIONALITÀ` come vincolo hard nel prompt:
  - priorità a ricette della stagione corrente o di tutto l'anno
  - evitare ingredienti fuori stagione (salvo che siano già in dispensa)
  - per ricette AI inventate, coerenza stagionale obbligatoria
- Le query per i contorni di fallback ora filtrano per stagione:
  `.or(\`seasons.cs.{${currentSeason}},seasons.is.null\`)`
- Aggiunta regola di output JSON strict (no caratteri extra nei nomi proprietà)

---

## v2.0 — Planner v2 (refactoring completo)

**Commit**: serie di commit (vedi `planner_v2_specs.md`)
**Data**: 2026-02
**File modificati**: `app/actions/menu-actions.ts`, `types/weekly-plan.ts`, schema DB

### Obiettivo
Riscrittura completa del modello dati e del prompt rispetto alla v1.

### Modifiche principali
- **Pasti come lista di ricette**: rimossi i campi fissi `vegetables/carbs/proteins`;
  ogni pasto è ora `recipes: MealRecipeItem[]`
- **Classi nutrizionali multi-valore**: ogni ricetta dichiara `nutritional_classes`
  (`veg | carbs | protein`); il vincolo di coverage opera sull'unione del pasto
- **Coverage hard**: ogni pranzo/cena deve coprire `veg + carbs + protein` per
  l'unione delle classi delle sue ricette
- **Ruolo ricetta**: introdotto `meal_role: main | side` per guidare il modello
- **Recipe ID nel prompt**: il contesto include le ricette esistenti con il loro
  UUID; il modello deve restituire `recipe_id` per le ricette esistenti
- **Ricette AI**: il modello può inventare ricette; vengono salvate subito in DB
  con `source='ai'`, `generated_at`, `model_name`, `generation_prompt_version`
- **Shopping list aggregata**: per ingrediente, con `recipe_ids[]` che tracciano
  quali ricette richiedono quell'ingrediente
- **Deduplicazione AI**: normalizzazione nome (trim/lower/collapse spazi) prima
  di inserire nuove ricette AI

---
