# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered weekly menu planner using Vercel AI SDK (`ai`) with structured output (Zod schemas) and multi-provider support (Groq, OpenAI) to generate balanced meal plans based on available pantry items and recipes. Built with Next.js 15 App Router, TypeScript, Supabase (local PostgreSQL), and Tailwind CSS.

**Core Feature**: One-shot menu generation with nutritional coverage validation and automatic side-dish supplementation.

## Essential Commands

### Development
```bash
npm run dev                    # Start Next.js dev server (http://localhost:3000)
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

### Database (Supabase Local)
```bash
npx supabase start             # Start local Supabase (requires Docker)
npx supabase db reset          # Reset DB and reapply all migrations
npm run gen:types              # Regenerate TypeScript types from schema
npx supabase migration new <name>  # Create new migration file
```

**Important**: After schema changes, always run `npm run gen:types` and commit `types/supabase.ts` alongside migrations.

Supabase Studio: http://127.0.0.1:54323

## Architecture

### Data Flow: Menu Generation

1. **Server Action** (`app/actions/menu-actions.ts:generateMenuAction`)
   - Fetches pantry items, recipes, and last week's menu from Supabase
   - Detects current season and filters seasonal recipes
   - Assembles context prompt with nutritional coverage rules

2. **LLM Call** (Vercel AI SDK `generateObject` with user-selected provider/model)
   - Provider/model chosen via UI dropdown (format: `provider:model`, e.g. `groq:llama-3.3-70b-versatile`)
   - Provider registry in `lib/ai/providers.ts` — dynamic import of provider packages
   - One-shot generation (no agentic loops to minimize cost)
   - Returns structured JSON matching Zod schema (`types/weekly-plan.ts`)

3. **Post-Processing**
   - **Coverage Validation**: Ensures each meal includes `veg`, `carbs`, and `protein`
   - **Frequency Check**: Prevents same recipe appearing >2 times/week
   - **Auto-補完**: Adds sides from DB or generic fallbacks if nutritional classes missing
   - **Recipe Deduplication**: Maps AI-generated recipes to existing DB entries by normalized name

4. **Draft Return**: Returns editable draft to frontend (saved in localStorage)
   - localStorage key: `menu_planner:draft_weekly_plan:v1`
   - Draft metadata stored: `draft_version`, `saved_at`, `notes`, `model_name`, `generation_prompt_version`
   - AI-generated recipes get `recipe_id: "new"` until saved; mapped to real DB IDs during `saveWeeklyPlanAction`
   - Meals can be toggled as "Pasto fuori casa" (empty `recipes` array + notes) via `MealEditor.tsx`

5. **Final Save** (`saveWeeklyPlanAction`)
   - Creates missing AI recipes in DB with `source='ai'`, `generated_at`, `model_name`, `generation_prompt_version`
   - Recalculates shopping list from recipe ingredients
   - Inserts into `weekly_plans` table

### Key Design Patterns

- **Server Actions** for all data mutations (no client-side API routes)
- **Zod Schemas** enforce LLM output structure and runtime validation
- **Normalized Recipe Names** for deduplication (`lib/planner-utils.ts:normalizeRecipeName`)
- **Fallback System**: DB sides → Generic fallbacks (`PLANNER_CONFIG.GENERIC_FALLBACKS`)

### Database Schema (Supabase)

Main tables (see `supabase/migrations/`):

- **`pantry_items`**: User's available ingredients (name, quantity, category)
- **`recipes`**: Recipe library with enums:
  - `meal_role`: `main` | `side`
  - `nutritional_classes`: `veg` | `carbs` | `protein` (array)
  - `seasons`: `Primavera` | `Estate` | `Autunno` | `Inverno` (array, nullable)
  - `source`: `user` | `ai`
- **`weekly_plans`**: Generated menus (JSONB: `menu_data`, `shopping_list`)

**Critical Enum Usage**: Always use database enum types from `types/supabase.ts` when writing SQL or mutations.

### Nutritional Coverage System

**Hard Requirement** (enforced in `menu-actions.ts:138-234`):
- Every meal (lunch/dinner) MUST cover: `['veg', 'carbs', 'protein']`
- If LLM output is incomplete, system auto-adds sides
- Validation happens before save; returns error if coverage impossible

**Config** (`lib/planner-utils.ts:PLANNER_CONFIG`):
- `REQUIRED_NUTRITIONAL_CLASSES`: The 3 mandatory classes
- `MAX_RECIPE_FREQUENCY_PER_WEEK`: 2 (prevents repetition)
- `GENERIC_FALLBACKS`: Emergency sides when DB has no matches
- `PROMPT_VERSION`: Current value `'planner-v2.1'` — increment when changing the generation prompt

### Seasonality

- Current season detected from system date (`menu-actions.ts:39-45`)
- Recipes have optional `seasons` array
- LLM prompt prioritizes seasonal recipes
- Fallback sides filtered by season: `.or(\`seasons.cs.{${currentSeason}},seasons.is.null\`)`

## File Structure

```
app/
  actions/menu-actions.ts       # All server actions (generate, save, CRUD)
  dashboard/page.tsx            # Pantry & recipes management
  planner/page.tsx              # Menu generator UI
  history/page.tsx              # Past menus viewer
  layout.tsx                    # Root layout with nav

lib/
  ai/providers.ts               # AI provider registry, model factory
  supabase.ts                   # Supabase client instance
  planner-utils.ts              # Config + validation utilities
  use-local-storage-draft.ts    # Draft persistence hook

components/
  PlannerClient.tsx             # Main planner page logic
  DashboardClient.tsx           # Pantry/recipes CRUD
  MealEditor.tsx                # Draft meal editing component
  RecipeFormModal.tsx           # Recipe add/edit form
  ExportButton.tsx              # CSV/JSON export logic

types/
  supabase.ts                   # Auto-generated from DB schema
  weekly-plan.ts                # Zod schemas for LLM output

supabase/
  migrations/*.sql              # Database migrations (version-controlled)
```

## Environment Variables

Required in `.env.local`:
```
# LLM Providers (at least one required)
GROQ_API_KEY=gsk_...
# OPENAI_API_KEY=sk-...           # Optional: enables OpenAI models in UI

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Model selection is done via the UI dropdown in the Planner page (no env var needed). The provider/model format stored in DB is `provider:model` (e.g. `groq:llama-3.3-70b-versatile`).

To add a new LLM provider: add its config to `lib/ai/providers.ts` (AI_PROVIDERS map + createModel switch case), install its `@ai-sdk/*` package, and set the corresponding env var.

## Common Tasks

### Adding New Recipes Features
1. Update `recipes` table schema via migration
2. Run `npm run gen:types`
3. Update Zod schemas in `types/weekly-plan.ts` if affecting LLM output
4. Modify prompt in `menu-actions.ts:generateMenuAction` if needed
5. Update UI forms in `RecipeFormModal.tsx`

### Modifying Menu Generation Logic
- **Prompt Changes**: Edit `menu-actions.ts:54-102`, increment `PROMPT_VERSION` in
  `lib/planner-utils.ts`, and add an entry to `docs/prompt-changelog.md`
- **Validation Rules**: Modify `lib/planner-utils.ts:checkCoverage`
- **Fallback Sides**: Update `PLANNER_CONFIG.GENERIC_FALLBACKS`

### CSV Import/Export
- Import recipes: `ImportRecipesModal.tsx` → `importRecipesAction`
- Export format: `ExportButton.tsx` (handles CSV headers with seasons)
- **Important**: CSV parser handles quoted fields with commas

## Testing Notes

No automated tests currently. Manual testing workflow:
1. Ensure Supabase is running (`npx supabase start`)
2. Add pantry items and recipes via Dashboard
3. Generate menu via Planner
4. Verify coverage (check each meal has veg+carbs+protein)
5. Test edge cases: empty pantry, no DB recipes, eating out (empty recipes array)

## Known Constraints

- **AI Cost Optimization**: No ReAct loops or multiple LLM calls per generation
- **RLS**: Permissive policies (dev-only; no auth implemented yet)
- **Season Detection**: Based on server date only (not user timezone)
- **Recipe Dedup**: Case-insensitive name matching only (no fuzzy matching)
