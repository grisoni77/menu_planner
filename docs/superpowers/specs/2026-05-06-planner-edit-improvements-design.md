# Planner edit improvements — Design

**Data:** 2026-05-06
**Status:** Approved
**Scope:** Migliorare l'esperienza di editing della bozza del menu settimanale nella vista `/planner`.

## Problema

L'attuale interfaccia di editing della bozza del menu (`PlannerClient.tsx` + `MealEditor.tsx`) ha tre limiti:

1. **Spostare un piatto da un pasto all'altro è scomodo:** richiede cancellare dalla sorgente e ri-aggiungere alla destinazione tramite il picker. Quando l'utente vuole rivoltare il menu, l'attrito è alto.
2. **Le ricette generate dall'AI vengono perse alla cancellazione:** finché la bozza non è salvata, le ricette `source='ai'` con `recipe_id='new'` esistono solo in localStorage. Cliccare il cestino le elimina senza modo di recuperarle.
3. **Ordinamento incoerente:** se aggiungi un `main` in un pasto che contiene già un `side`, il `main` resta in coda — l'ordine visivo riflette la cronologia di inserimento, non la priorità del piatto.

In più, **creare una ricetta nuova** richiede di lasciare la vista planner: aprire il Dashboard, usare `RecipeFormModal`, tornare al planner. Flusso inutilmente lungo per chi sta già componendo il menu.

## Obiettivi

1. Spostare un piatto tra due pasti qualunque della settimana con drag & drop.
2. Rendere l'ordinamento dei piatti dentro un pasto deterministico: prima `main`, poi `side`; secondario alfabetico.
3. Permettere la creazione di una nuova ricetta direttamente dal picker, senza lasciare la vista.
4. Tutto questo senza modificare lo schema DB, senza migrazioni, senza breaking change al formato della bozza in localStorage.

## Non-obiettivi

- Pannello laterale "pool ricette AI scartate" — l'utente l'ha esplicitamente rifiutato. Per non perdere una ricetta AI basta trascinarla altrove invece di cancellarla.
- Drag & drop di un pasto intero (tutto il pranzo → cena di altro giorno).
- Riordino manuale all'interno di un pasto (l'ordinamento auto rende il riordino superfluo).
- Conferma o "undo" sul cestino: se clicchi cestino, il piatto sparisce. La perdita è esplicita.

## Decisioni di design

### D1. Libreria drag & drop: `@dnd-kit/core` + `@dnd-kit/sortable`

Tre alternative valutate:
- **`@dnd-kit/*`**: moderna, accessibile (KeyboardSensor gratis), supporta cross-container, ~30kB. **Scelta.**
- **`react-dnd`**: più matura ma API ingombrante e meno adatta a React 19.
- **HTML5 nativo**: zero dipendenze ma drag preview e cross-container scomodi, esperienza touch debole.

`@dnd-kit/utilities` è un peer di fatto per `useSortable` e va aggiunto.

### D2. Semantica del drop: move only, mai copia

Nessun modificatore (Alt/Ctrl) per copiare. Se l'utente vuole il piatto in due pasti, lo aggiunge la seconda volta dal picker. Mantenere una sola modalità rende prevedibile sia il D&D sia il modello dati.

### D3. Drop zone bloccate per pasti "fuori casa"

Un pasto in modalità "Pasto fuori casa" (riconosciuto con la stessa euristica usata oggi: `recipes.length === 0 && notes?.toLowerCase().includes("pasto fuori casa")`) non accetta drop. Visivamente: nessun highlight quando lo si sorvola, cursor `not-allowed`. La modalità "fuori casa" resta uno stato esplicito che si toglie solo dal toggle dedicato.

### D4. Ordinamento solo a render-time

`MealPlan.recipes` resta un array nell'ordine di inserimento. Il sort vive in `MealEditor.tsx` (e `MealDisplay.tsx` per la vista read-only). Vantaggi:

- Zero impatto sul payload salvato in `weekly_plans.menu_data`.
- Zero impatto sull'output strutturato dell'AI.
- Rollback facile (basta togliere il sort).

Implementazione (`MealEditor.tsx`):

```ts
const sortedRecipes = [...meal.recipes]
  .map((recipe, originalIndex) => ({ recipe, originalIndex }))
  .sort((a, b) => {
    if (a.recipe.meal_role !== b.recipe.meal_role) {
      return a.recipe.meal_role === 'main' ? -1 : 1;
    }
    return a.recipe.name.localeCompare(b.recipe.name, 'it');
  });
```

`originalIndex` è essenziale per `removeRecipe`: il cestino deve operare sull'array originale, non sulla vista ordinata, altrimenti si cancella la ricetta sbagliata.

### D5. Creazione ricetta inline come bozza, non come record DB

L'utente ha scelto B (bozza) sopra A (salva subito): le ricette create inline vivono nel draft come quelle AI, finiscono in DB solo se il menu viene salvato.

Vantaggi:
- Coerenza con il flusso AI esistente.
- Niente "ricette di prova" che sporcano la libreria.
- Riusa il campo `MealRecipeItem.ai_creation_data` (rinominato concettualmente come "creation_data" ma senza migrazione di tipo).

Lo svantaggio (perdita se l'utente scarta il menu) è coerente con la scelta sui non-obiettivi: nessun safeguard sulle bozze, AI o utente. Il modello mentale è "tutto ciò che è draft sparisce se scarti".

### D6. Form ridotto per la creazione inline

Dentro `RecipePickerDialog` la creazione mostra solo:

- `name` (text, required)
- `nutritional_classes` (checkbox group, almeno 1)
- `ingredients` (text input, separati da virgola, required)

`meal_role` è implicito dal contesto (l'utente ha cliccato `+ Main` o `+ Side`). `tags` e `seasons` saltati: se la ricetta finisce in DB col save, l'utente può completarla dal Dashboard.

## Architettura

Modifiche localizzate al lato client del planner. Nessuna modifica a schema DB, server actions (eccetto un piccolo fix in `saveWeeklyPlanAction`), tipi Zod, o configurazione.

### File toccati

| File | Cambiamento |
|---|---|
| `package.json` | Aggiunti `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. |
| `components/PlannerClient.tsx` | Avvolge la griglia settimanale in `<DndContext>`; gestisce `onDragEnd` per mutare il draft. |
| `components/MealEditor.tsx` | Pasto = drop zone (`useDroppable`); ricetta = item draggable (`useDraggable`); applica sort a render-time. |
| `components/RecipePickerDialog.tsx` | Aggiunge view "Crea nuova" con form ridotto, gestita localmente con `useState<'search' \| 'create'>`. |
| `components/MealDisplay.tsx` | Estende il sort esistente (oggi solo main/side, vedi linee 21-25) per aggiungere il secondario alfabetico. |
| `app/actions/menu-actions.ts` | In `saveWeeklyPlanAction`, l'insert di una nuova ricetta non hardcoda `source: 'ai'` ma usa `recipe.source`. Campi `generated_at`/`model_name`/`generation_prompt_version` solo se `source === 'ai'`. |

### Flusso D&D end-to-end

1. Utente preme su una card ricetta in `MealEditor`. Sensor di `@dnd-kit` aspetta uno spostamento di 5 px prima di attivare il drag (previene drag accidentali quando l'intento era cliccare il cestino).
2. Inizio drag: appare `<DragOverlay>` con la card "fluttuante" sotto il cursore. La card originale resta visibile con `opacity: 0.4`.
3. Sorvolando una drop zone valida (pasto non-fuori-casa diverso da quello di origine), la zona evidenzia un ring `ring-2 ring-indigo-300`. Sorvolando la sorgente, nessun feedback. Sorvolando un fuori casa, niente highlight + cursor `not-allowed`.
4. Drop su zona valida: `PlannerClient.onDragEnd` rimuove la ricetta dal pasto sorgente e la appende al pasto destinazione. Una sola chiamata `setDraft({...draft, weekly_menu: nextMenu})`. Il sort a render-time la riposiziona nell'ordine corretto.
5. Drop su zona invalida o fuori da una drop zone: nessuna mutazione.

### Dati: nessun cambiamento di schema

`MealRecipeItemSchema` (`types/weekly-plan.ts`) resta identico. Il campo `ai_creation_data` viene riusato anche per ricette create dall'utente inline (`source: 'user'`) — il nome resta storico, non si rinomina per evitare churn nel codice esistente.

Aggiunta possibile (cosmetica, non bloccante): aggiornare la `.describe()` Zod del campo per documentare il dual-use:

```ts
ai_creation_data: z.object({...}).nullable().describe(
  "Dati per creare la ricetta in DB se source è 'ai' o se è una ricetta draft creata inline dall'utente."
)
```

### Fix server-side in `saveWeeklyPlanAction`

Posizione: `app/actions/menu-actions.ts:343-358` (insert di una ricetta nuova).

**Oggi:**

```ts
.insert({
  name: recipe.name,
  meal_role: recipe.meal_role as RecipeRole,
  nutritional_classes: recipe.nutritional_classes as NutritionalClassDB[],
  ingredients: recipe.ai_creation_data?.ingredients.map((i: string) => ({ name: i })) || [],
  tags: recipe.ai_creation_data?.tags || [],
  source: 'ai',                                    // ← hardcoded
  generated_at: new Date().toISOString(),
  model_name: model_name || 'unknown',
  generation_prompt_version: generation_prompt_version || PLANNER_CONFIG.PROMPT_VERSION,
  user_id: user!.id
})
```

**Dopo:**

```ts
.insert({
  name: recipe.name,
  meal_role: recipe.meal_role as RecipeRole,
  nutritional_classes: recipe.nutritional_classes as NutritionalClassDB[],
  ingredients: recipe.ai_creation_data?.ingredients.map((i: string) => ({ name: i })) || [],
  tags: recipe.ai_creation_data?.tags || [],
  source: recipe.source,
  ...(recipe.source === 'ai' && {
    generated_at: new Date().toISOString(),
    model_name: model_name || 'unknown',
    generation_prompt_version: generation_prompt_version || PLANNER_CONFIG.PROMPT_VERSION,
  }),
  user_id: user!.id
})
```

La condizione di trigger della branch (linea 325) resta `if (recipe.recipe_id === 'new' || recipe.source === 'ai')`: copre sia ricette AI sia ricette user-draft create inline (che hanno `recipe_id: 'new'` e `source: 'user'`).

## Casi limite

- **Drop sullo stesso pasto:** no-op silenzioso. Il sort riposiziona comunque, eventuali rumori cosmetici sono tollerabili (nessun re-render extra significativo).
- **Drop che svuota il pasto sorgente:** nessun trattamento speciale. Il pasto vuoto entra nella validation con il messaggio esistente "Seleziona ricette o imposta Pasto fuori casa". L'utente può fixare ri-aggiungendo o impostando "fuori casa".
- **Pasto destinazione con coverage incompleta dopo il drop:** la validation gestisce già questo caso. Niente popup, niente blocco — l'errore appare nel pannello rosso in cima.
- **Click sul cestino durante un quasi-drag:** `activationConstraint: { distance: 5 }` previene attivazioni spurie. Il click sul cestino raggiunge il suo handler regolarmente.
- **Trash su ricetta AI:** comportamento attuale invariato (sparisce). L'utente ha esplicitamente rifiutato un safeguard.
- **Creazione inline di una ricetta con nome già esistente in DB:** la dedup nel save action (linea 333-341, `ilike('name', normalizedName)`) la riconcilia con l'esistente — comportamento già presente per le ricette AI, riusato qui.

## Testing manuale

Nessun test automatico esiste nel progetto (CLAUDE.md). Checklist post-implementazione:

1. **D&D base:** trascinare una ricetta pranzo → cena stesso giorno; pranzo lunedì → pranzo giovedì; ricetta AI tra giorni (verificare che resti in bozza).
2. **D&D bloccato:** un pasto target è "Pasto fuori casa" — niente highlight, drop senza effetto.
3. **D&D sorgente svuotata:** il pasto svuotato compare nel pannello errori con il messaggio esistente.
4. **Sort:** un pasto con due main e un side mostra main in ordine alfabetico, poi side. Il cestino su un main rimuove quello giusto.
5. **Creazione inline:** picker → "+ Crea nuova" → compilare nome/classi/ingredienti → submit → la ricetta compare nel pasto come item draggable. Dopo `Salva Piano`, in DB esiste `recipes` con `source='user'`, `generated_at IS NULL`.
6. **Regressione AI flow:** generazione AI funziona, ricette AI nel draft funzionano, salvataggio AI inserisce in DB con `source='ai'` e `generated_at` valorizzato.
7. **Regressione picker classico:** `+ Main`/`+ Side` con scelta ricetta esistente funziona, recipe_id viene popolato correttamente.
8. **Regressione altri controlli:** trash, toggle "fuori casa", export MD, validation.
9. **Accessibilità basica:** Tab, Space (pickup), frecce, Space (drop) — il D&D funziona da tastiera grazie a `KeyboardSensor`.

## Rollout

- Niente feature flag (single-user dev tool, `RLS` permissivo, no traffic in produzione).
- Niente migrazione DB.
- Niente breaking change al payload `localStorage` (`menu_planner:draft_weekly_plan:v1`): le bozze esistenti continuano a caricarsi e ad essere modificabili.
- `PROMPT_VERSION` invariato: il prompt AI non cambia.
- Una sola PR, tutte le feature insieme: sono cambiamenti coerenti che condividono la stessa zona di codice.
