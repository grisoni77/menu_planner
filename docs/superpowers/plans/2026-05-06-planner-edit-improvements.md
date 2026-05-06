# Planner Edit Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere drag&drop tra pasti, ordinamento auto main→side/alfabetico e creazione ricette inline come bozza nel picker della vista `/planner`.

**Architecture:** Cambiamenti confinati al lato client del planner. Il modello dati (`MealRecipeItem`, schemi Zod, schema DB) non cambia. Una sola modifica server-side: `saveWeeklyPlanAction` deve smettere di hardcodare `source: 'ai'` quando crea ricette draft. L'ordinamento è solo a render-time (zero impatto sul payload). Il drag&drop usa `@dnd-kit/core` + `@dnd-kit/sortable` con sensor di attivazione a 5px per non interferire con il cestino.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind, `@dnd-kit/*` (nuovo), Supabase server actions.

**Spec di riferimento:** `docs/superpowers/specs/2026-05-06-planner-edit-improvements-design.md`

**Nota su test:** il progetto non ha test automatici (vedi CLAUDE.md). Ogni task include una checklist di verifica manuale nel browser invece di test code. Lo step "manual verify" è bloccante per l'avanzamento del task.

---

## Task 1: Aggiungere dipendenze `@dnd-kit/*`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Installare i pacchetti**

Run:
```bash
npm install @dnd-kit/core@^6 @dnd-kit/sortable@^8 @dnd-kit/utilities@^3
```

- [ ] **Step 2: Verificare che siano in `package.json`**

Run:
```bash
grep -E "@dnd-kit/(core|sortable|utilities)" package.json
```

Expected output: 3 righe, una per ciascun pacchetto.

- [ ] **Step 3: Verificare che il build passi**

Run:
```bash
npm run build
```

Expected: `✓ Compiled successfully` (o equivalente di Next 16). Se fallisce con errori non legati a dnd-kit (es. errori preesistenti del progetto), annotarli e proseguire — il setup di dnd-kit non introduce codice in questo step.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
Aggiungi dipendenze @dnd-kit per il drag&drop del planner

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Aggiungere il comparator condiviso per l'ordinamento

**Files:**
- Modify: `lib/planner-utils.ts`

- [ ] **Step 1: Aprire `lib/planner-utils.ts` e aggiungere il comparator**

Aggiungi in fondo al file (dopo le altre export). Importa `MealRecipeItem` se non già importato.

```ts
import type { MealRecipeItem } from "@/types/weekly-plan";

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
```

- [ ] **Step 2: Verificare che il file compili (typecheck)**

Run:
```bash
npx tsc --noEmit
```

Expected: niente errori in `lib/planner-utils.ts`. Se ci sono errori in altri file preesistenti, annotare e proseguire.

- [ ] **Step 3: Commit**

```bash
git add lib/planner-utils.ts
git commit -m "$(cat <<'EOF'
Aggiungi comparator condiviso per ordinare i piatti di un pasto

Ordina prima i 'main' poi i 'side', secondario alfabetico (it).
Usato sia da MealEditor (vista bozza) che da MealDisplay (vista
piano salvato).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Applicare l'ordinamento in `MealDisplay` (vista read-only)

**Files:**
- Modify: `components/MealDisplay.tsx:21-25`

- [ ] **Step 1: Sostituire il sort esistente con quello condiviso**

In `components/MealDisplay.tsx` rimuovi il sort manuale alle linee 21-25:

```ts
  // Ordina le ricette: prima i 'main', poi i 'side'
  const sortedRecipes = [...meal.recipes].sort((a, b) => {
    if (a.meal_role === 'main' && b.meal_role !== 'main') return -1;
    if (a.meal_role !== 'main' && b.meal_role === 'main') return 1;
    return 0;
  });
```

E rimpiazzalo con:

```ts
  const sortedRecipes = [...meal.recipes].sort(compareMealRecipes);
```

Aggiorna l'import in cima al file aggiungendo `compareMealRecipes`:

```ts
import { checkCoverage, compareMealRecipes } from "@/lib/planner-utils";
```

- [ ] **Step 2: Verificare in browser**

Avvia il dev server (se non già attivo):
```bash
npm run dev
```

Apri `/history`, scegli un piano salvato che abbia un pasto con almeno un main e un side. Verifica che:
- Main viene mostrato prima del side.
- Se ci sono due main con nomi che iniziano con lettere diverse (es. "Zuppa di lenticchie" e "Asparagi al forno"), quello alfabeticamente prima ("Asparagi") viene mostrato per primo.

Se non hai dati di test adatti, salva una bozza dal planner con almeno due main per pasto e ispeziona la `/history` view.

- [ ] **Step 3: Commit**

```bash
git add components/MealDisplay.tsx
git commit -m "$(cat <<'EOF'
Aggiungi secondario alfabetico al sort di MealDisplay

Riusa compareMealRecipes da planner-utils per coerenza con la
vista bozza.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Applicare l'ordinamento in `MealEditor` (vista bozza)

**Files:**
- Modify: `components/MealEditor.tsx:27-31, 61-96`

Questo task è puramente sull'ordinamento. Il D&D arriva al Task 5/6.

- [ ] **Step 1: Aggiornare il rendering della lista per usare il comparator**

In `components/MealEditor.tsx`, aggiorna l'import:

```ts
import { compareMealRecipes } from "@/lib/planner-utils";
```

E sostituisci il blocco `<ul>...</ul>` (linee 61-96, ovvero il render delle ricette quando `!isEatingOutMode`) per applicare il sort preservando l'`originalIndex`:

```tsx
<ul className="space-y-2">
  {meal.recipes
    .map((recipe, originalIndex) => ({ recipe, originalIndex }))
    .sort((a, b) => compareMealRecipes(a.recipe, b.recipe))
    .map(({ recipe, originalIndex }) => (
    <li key={originalIndex} className="group relative flex flex-col p-2 bg-slate-50 rounded border border-slate-100">
      <div className="flex justify-between gap-2">
        <span className="text-xs font-semibold leading-tight pr-6">{recipe.name}</span>
        <UIButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-red-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => removeRecipe(originalIndex)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </UIButton>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
         <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 uppercase ${
          recipe.meal_role === 'main' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50'
        }`}>
          {recipe.meal_role}
        </Badge>
        {recipe.nutritional_classes.map(c => (
          <Badge
            key={c}
            variant="secondary"
            className={`text-[8px] px-1 py-0 h-3.5 capitalize ${
              c === 'veg' ? 'bg-green-100 text-green-700' : 
              c === 'carbs' ? 'bg-amber-100 text-amber-700' : 
              'bg-red-100 text-red-700'
            }`}
          >
            {c}
          </Badge>
        ))}
      </div>
    </li>
  ))}
  <div className="flex gap-1">
    <UIButton
      variant="ghost"
      size="sm"
      className="flex-1 h-8 border-dashed border-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1 text-[10px]"
      onClick={() => onAddRecipe('main')}
    >
      <Plus className="h-3 w-3" /> Main
    </UIButton>
    <UIButton
      variant="ghost"
      size="sm"
      className="flex-1 h-8 border-dashed border-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1 text-[10px]"
      onClick={() => onAddRecipe('side')}
    >
      <Plus className="h-3 w-3" /> Side
    </UIButton>
  </div>
</ul>
```

Punti chiave:
- `originalIndex` è preservato dentro l'oggetto sortato e usato sia come `key` sia come argomento di `removeRecipe`. Senza questo, il cestino sull'item visualmente N-esimo cancellerebbe la ricetta nella posizione N dell'array originale, che dopo il sort è una ricetta diversa.

- [ ] **Step 2: Verificare in browser**

Run `npm run dev` se non attivo. Vai su `/planner`, genera un menu (o riapri una bozza esistente). Per un pasto con almeno un main + un side:

1. Verifica visivamente che il main sia mostrato sopra il side.
2. Se ci sono due main, verifica l'ordine alfabetico.
3. **Test critico per `originalIndex`:** in un pasto con due ricette, clicca il cestino sulla *prima visualizzata* e verifica che cancelli quella, non l'altra.
4. Aggiungi un nuovo main da `+ Main` in un pasto che già ha solo un side: il main deve apparire sopra al side dopo l'aggiunta.

- [ ] **Step 3: Commit**

```bash
git add components/MealEditor.tsx
git commit -m "$(cat <<'EOF'
Ordina i piatti in MealEditor con compareMealRecipes

Main prima, poi side, alfabetico secondario. Preserva
originalIndex per il cestino.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Trasformare `MealEditor` in drop zone + draggable items

**Files:**
- Modify: `components/MealEditor.tsx`

Questo task aggiunge il "lato passivo" del D&D in `MealEditor`: il pasto diventa un `useDroppable`, ogni ricetta un `useDraggable`. Il "lato attivo" (DndContext + onDragEnd) arriva al Task 6.

- [ ] **Step 1: Aggiornare gli import e l'interfaccia del componente**

In cima a `components/MealEditor.tsx`, aggiungi:

```ts
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
```

Modifica l'interfaccia delle props per ricevere identificativi che servono al DnD context:

```ts
interface MealEditorProps {
  title: string;
  meal: MealPlan;
  day: string;                // es. "Lunedì"
  mealKey: 'lunch' | 'dinner';
  onChange: (updatedMeal: MealPlan) => void;
  onAddRecipe: (role: 'main' | 'side') => void;
}
```

E aggiorna la firma del componente:

```tsx
export function MealEditor({ title, meal, day, mealKey, onChange, onAddRecipe }: MealEditorProps) {
```

- [ ] **Step 2: Calcolare l'ID drop zone e usare `useDroppable`**

Subito dopo la firma del componente, prima di `isEatingOutMode`:

```ts
  const dropId = `meal:${day}:${mealKey}`;
  const isEatingOutMode = meal.recipes.length === 0 && meal.notes?.toLowerCase().includes("pasto fuori casa");

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    disabled: isEatingOutMode,
    data: { day, mealKey },
  });
```

Punti chiave:
- `disabled: isEatingOutMode` blocca il drop sul fuori casa (decisione D3 della spec).
- `isOver` è true quando un drag attivo sta sorvolando questa drop zone (e non è disabilitata).
- `data` viene letto dall'`onDragEnd` in `PlannerClient` per sapere dove droppare.

- [ ] **Step 3: Applicare il ref droppable al container e aggiungere il visual feedback**

Modifica il `<div>` root del componente:

```tsx
return (
  <div
    ref={setDropRef}
    className={`space-y-2 border rounded-md p-3 bg-white shadow-sm transition-colors ${
      isOver ? 'ring-2 ring-indigo-300 border-indigo-300' : ''
    }`}
  >
```

- [ ] **Step 4: Creare un sotto-componente `DraggableRecipeItem`**

Definirlo nello stesso file, sopra l'export di `MealEditor`. Riceve `recipe`, `originalIndex`, `day`, `mealKey`, e `onRemove`:

```tsx
interface DraggableRecipeItemProps {
  recipe: MealRecipeItem;
  originalIndex: number;
  day: string;
  mealKey: 'lunch' | 'dinner';
  onRemove: () => void;
}

function DraggableRecipeItem({ recipe, originalIndex, day, mealKey, onRemove }: DraggableRecipeItemProps) {
  const dragId = `recipe:${day}:${mealKey}:${originalIndex}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { day, mealKey, originalIndex, recipe },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex flex-col p-2 bg-slate-50 rounded border border-slate-100"
    >
      <div className="flex justify-between gap-2">
        <span className="text-xs font-semibold leading-tight pr-6">{recipe.name}</span>
        <UIButton
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-red-500 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </UIButton>
      </div>
      <div className="flex flex-wrap gap-1 mt-1">
        <Badge variant="outline" className={`text-[8px] px-1 py-0 h-3.5 uppercase ${
          recipe.meal_role === 'main' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50'
        }`}>
          {recipe.meal_role}
        </Badge>
        {recipe.nutritional_classes.map(c => (
          <Badge
            key={c}
            variant="secondary"
            className={`text-[8px] px-1 py-0 h-3.5 capitalize ${
              c === 'veg' ? 'bg-green-100 text-green-700' :
              c === 'carbs' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}
          >
            {c}
          </Badge>
        ))}
      </div>
    </li>
  );
}
```

Punti chiave:
- `e.stopPropagation()` su click e `onPointerDown` del cestino: previene che il pointerdown del cestino faccia partire un drag dell'intero `<li>`. Senza `stopPropagation` su `onPointerDown`, il click trash diventa un drag.
- `touchAction: 'none'` è raccomandato da dnd-kit per disabilitare il browser scroll su touch quando si trascina (anche se l'app è desktop-first, evita stranezze).
- Importare `MealRecipeItem` da `@/types/weekly-plan` se non già importato.

- [ ] **Step 5: Sostituire il rendering della lista in `MealEditor` per usare `DraggableRecipeItem`**

Nel rendering del pasto non-fuori-casa, sostituisci ogni `<li>` ricetta con `<DraggableRecipeItem>`:

```tsx
<ul className="space-y-2">
  {meal.recipes
    .map((recipe, originalIndex) => ({ recipe, originalIndex }))
    .sort((a, b) => compareMealRecipes(a.recipe, b.recipe))
    .map(({ recipe, originalIndex }) => (
      <DraggableRecipeItem
        key={originalIndex}
        recipe={recipe}
        originalIndex={originalIndex}
        day={day}
        mealKey={mealKey}
        onRemove={() => removeRecipe(originalIndex)}
      />
    ))}
  <div className="flex gap-1">
    <UIButton
      variant="ghost"
      size="sm"
      className="flex-1 h-8 border-dashed border-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1 text-[10px]"
      onClick={() => onAddRecipe('main')}
    >
      <Plus className="h-3 w-3" /> Main
    </UIButton>
    <UIButton
      variant="ghost"
      size="sm"
      className="flex-1 h-8 border-dashed border-2 text-slate-400 hover:text-slate-600 hover:border-slate-300 flex items-center justify-center gap-1 text-[10px]"
      onClick={() => onAddRecipe('side')}
    >
      <Plus className="h-3 w-3" /> Side
    </UIButton>
  </div>
</ul>
```

- [ ] **Step 6: Aggiornare `PlannerClient.tsx` per passare `day` e `mealKey` a `MealEditor`**

In `components/PlannerClient.tsx`, alla render del `MealEditor` (linee ~272-283), aggiungi le due nuove props:

```tsx
<MealEditor
  title="Pranzo"
  meal={day.lunch}
  day={day.day}
  mealKey="lunch"
  onChange={(m) => updateDraftMeal(day.day, 'lunch', m)}
  onAddRecipe={(role) => handleAddRecipe(day.day, 'lunch', role)}
/>
<MealEditor
  title="Cena"
  meal={day.dinner}
  day={day.day}
  mealKey="dinner"
  onChange={(m) => updateDraftMeal(day.day, 'dinner', m)}
  onAddRecipe={(role) => handleAddRecipe(day.day, 'dinner', role)}
/>
```

- [ ] **Step 7: Verificare il typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: niente errori in `components/MealEditor.tsx` e `components/PlannerClient.tsx`. Risolvi eventuali type mismatch sulle nuove props.

- [ ] **Step 8: Verificare in browser (D&D ancora non funziona, ma il rendering deve essere intatto)**

Run `npm run dev`. Apri `/planner`, genera o riapri una bozza. Verifica:

1. Le ricette si visualizzano normalmente, ordinate main→side/alfabetico.
2. Il cursor è `grab` quando passi sopra una ricetta.
3. **Cliccare il cestino funziona**: cancella la ricetta giusta senza far partire un drag.
4. Cliccando+trascinando una ricetta, l'opacity scende a ~0.4 ma non succede nulla al rilascio (è atteso: il DndContext arriva nel Task 6).
5. Il toggle "Pasto fuori casa" funziona ancora.
6. Il bottone `+ Main` / `+ Side` apre il picker e l'aggiunta funziona.

- [ ] **Step 9: Commit**

```bash
git add components/MealEditor.tsx components/PlannerClient.tsx
git commit -m "$(cat <<'EOF'
Trasforma MealEditor in drop zone e ricette in draggable

Ogni pasto registra useDroppable (disabilitato se fuori casa);
ogni ricetta usa useDraggable con stopPropagation sul cestino
per non innescare drag spuri.

Senza DndContext il drag non muta ancora lo stato — quello
arriva nel task successivo.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Wirare `<DndContext>` e `onDragEnd` in `PlannerClient`

**Files:**
- Modify: `components/PlannerClient.tsx`

- [ ] **Step 1: Aggiornare gli import**

In cima a `components/PlannerClient.tsx`:

```ts
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
```

- [ ] **Step 2: Definire i sensors e lo stato del drag attivo**

Dentro la funzione `PlannerClient`, dopo gli altri `useState`:

```ts
  const [activeDragRecipe, setActiveDragRecipe] = useState<MealRecipeItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor),
  );
```

Punti chiave:
- `distance: 5` = il drag parte solo dopo 5px di movimento. Senza questo, un click semplice (es. sul cestino interno) viene interpretato come drag.
- `KeyboardSensor` abilita il D&D da tastiera (Tab → Space → frecce → Space).

- [ ] **Step 3: Definire gli handler `onDragStart` e `onDragEnd`**

Dentro `PlannerClient`, sopra il `return`:

```ts
  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as
      | { day: string; mealKey: 'lunch' | 'dinner'; originalIndex: number; recipe: MealRecipeItem }
      | undefined;
    if (data?.recipe) setActiveDragRecipe(data.recipe);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragRecipe(null);
    if (!draft || !event.over) return;

    const source = event.active.data.current as
      | { day: string; mealKey: 'lunch' | 'dinner'; originalIndex: number; recipe: MealRecipeItem }
      | undefined;
    const target = event.over.data.current as
      | { day: string; mealKey: 'lunch' | 'dinner' }
      | undefined;

    if (!source || !target) return;

    // No-op: drop sullo stesso pasto.
    if (source.day === target.day && source.mealKey === target.mealKey) return;

    const newMenu = draft.weekly_menu.map(d => {
      if (d.day !== source.day && d.day !== target.day) return d;

      const updated: typeof d = { ...d };

      if (d.day === source.day) {
        const sourceMeal = updated[source.mealKey];
        const newRecipes = sourceMeal.recipes.filter((_, i) => i !== source.originalIndex);
        updated[source.mealKey] = {
          ...sourceMeal,
          recipes: newRecipes,
          ingredients_used_from_pantry: sourceMeal.ingredients_used_from_pantry || [],
        };
      }

      if (updated.day === target.day) {
        const targetMeal = updated[target.mealKey];
        updated[target.mealKey] = {
          ...targetMeal,
          recipes: [...targetMeal.recipes, source.recipe],
          ingredients_used_from_pantry: targetMeal.ingredients_used_from_pantry || [],
        };
      }

      return updated;
    });

    setDraft({ ...draft, weekly_menu: newMenu });
  }
```

Punti chiave:
- Quando source e target sono nello stesso `day` ma pasti diversi (pranzo↔cena), il `.map()` aggiorna **entrambi i meal nello stesso giorno** in un singolo passo grazie ai due `if` separati. Importante: il secondo `if` lavora su `updated.day`, non `d.day`, per agganciarsi all'oggetto già clonato.
- Quando source e target sono in giorni diversi, ogni `if` agisce sul giorno suo.

- [ ] **Step 4: Avvolgere la griglia settimanale in `<DndContext>` con `<DragOverlay>`**

Sostituisci il blocco che inizia con `<div className="grid md:grid-cols-2 ...">` (linea ~268) avvolgendolo:

```tsx
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {draft.weekly_menu.map((day) => (
      <div key={day.day} className="space-y-4">
        <h3 className="font-bold text-lg border-b pb-1">{day.day}</h3>
        <MealEditor
          title="Pranzo"
          meal={day.lunch}
          day={day.day}
          mealKey="lunch"
          onChange={(m) => updateDraftMeal(day.day, 'lunch', m)}
          onAddRecipe={(role) => handleAddRecipe(day.day, 'lunch', role)}
        />
        <MealEditor
          title="Cena"
          meal={day.dinner}
          day={day.day}
          mealKey="dinner"
          onChange={(m) => updateDraftMeal(day.day, 'dinner', m)}
          onAddRecipe={(role) => handleAddRecipe(day.day, 'dinner', role)}
        />
      </div>
    ))}
  </div>

  <DragOverlay>
    {activeDragRecipe ? (
      <div className="p-2 bg-white border border-indigo-300 rounded shadow-lg text-xs font-semibold max-w-[220px]">
        {activeDragRecipe.name}
      </div>
    ) : null}
  </DragOverlay>
</DndContext>
```

`DragOverlay` deve essere dentro `DndContext` ma **fuori** dalla griglia (è un portal-like fluttuante).

- [ ] **Step 5: Verificare il typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: niente errori.

- [ ] **Step 6: Verificare in browser**

Run `npm run dev`. Apri `/planner`, genera o riapri una bozza con almeno 2 giorni configurati.

1. **Move pranzo→cena stesso giorno:** trascina una ricetta da Pranzo Lunedì a Cena Lunedì. La ricetta sparisce dal pranzo e appare nella cena, ordinata correttamente.
2. **Move cross-day:** trascina una ricetta da Pranzo Lunedì a Pranzo Giovedì. Stesso comportamento.
3. **DragOverlay:** durante il trascinamento appare la card "fluttuante" con il nome ricetta.
4. **Highlight drop zone:** sorvolando un pasto valido (non fuori casa, diverso dalla sorgente), il bordo si colora `ring-indigo-300`. Sorvolando il pasto sorgente, niente highlight.
5. **Drop su fuori casa bloccato:** marca un pasto come "Pasto fuori casa". Trascina una ricetta dal pasto sorgente sopra il pasto fuori casa: niente highlight; rilasciando, niente effetto.
6. **Drop fuori dalle drop zone:** trascina e rilascia su uno spazio vuoto: niente effetto, l'`activeDragRecipe` torna null.
7. **Drop sullo stesso pasto:** no-op, la ricetta resta dov'era.
8. **Source svuotato:** trascina via l'unica ricetta di un pasto. Il pannello errori mostra "Seleziona ricette o imposta Pasto fuori casa" per quel pasto.
9. **Cestino:** cliccare il cestino su una ricetta cancella senza scatenare drag.
10. **+ Main / + Side / picker:** ancora funzionanti come prima.
11. **Tastiera:** premi Tab fino a focus su una ricetta, Space per pickup, frecce per spostare focus su un'altra drop zone, Space per drop. Verifica che il move avvenga.

- [ ] **Step 7: Commit**

```bash
git add components/PlannerClient.tsx
git commit -m "$(cat <<'EOF'
Abilita il drag&drop tra pasti nella vista planner

DndContext con PointerSensor (5px activation) e KeyboardSensor.
onDragEnd muta il draft con un singolo setDraft, gestendo sia
move intra-giorno (entrambi i pasti dello stesso day) sia
cross-giorno. DragOverlay per il feedback visivo.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Aggiungere la view "Crea nuova ricetta" in `RecipePickerDialog`

**Files:**
- Modify: `components/RecipePickerDialog.tsx`

- [ ] **Step 1: Aggiornare imports e introdurre lo stato della view**

In cima al file, aggiungi gli import che servono per il form:

```ts
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ArrowLeft } from "lucide-react";
import { NutritionalClass } from "@/types/weekly-plan";
```

(Il file usa già `Search`, `Loader2` da `lucide-react`: verifica che l'import esista e aggiungi i nuovi alla stessa riga.)

Aggiungi una costante con le classi nutrizionali, sopra il componente:

```ts
const NUTRITIONAL_CLASSES: { value: NutritionalClass; label: string }[] = [
  { value: 'veg', label: 'Verdura (Veg)' },
  { value: 'carbs', label: 'Carboidrati' },
  { value: 'protein', label: 'Proteine' },
];
```

- [ ] **Step 2: Aggiungere lo stato per la view (search vs create) e per i campi del form**

Dentro `RecipePickerDialog`, accanto agli altri `useState`:

```ts
  const [view, setView] = useState<'search' | 'create'>('search');
  const [createName, setCreateName] = useState("");
  const [createIngredients, setCreateIngredients] = useState("");
  const [createClasses, setCreateClasses] = useState<NutritionalClass[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
```

E un effetto che resetta tutto quando la dialog si chiude:

```ts
  useEffect(() => {
    if (!isOpen) {
      setView('search');
      setCreateName("");
      setCreateIngredients("");
      setCreateClasses([]);
      setCreateError(null);
    }
  }, [isOpen]);
```

- [ ] **Step 3: Aggiungere la funzione di submit della creazione**

Dentro il componente, sopra il `return`:

```ts
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
```

- [ ] **Step 4: Aggiornare il rendering del `<DialogContent>` con switch tra view**

Sostituisci il body della dialog (tutto ciò che c'è dentro `<DialogContent>` dopo `<DialogHeader>`) con un branch che mostra search o create:

```tsx
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
```

Punti chiave:
- `meal_role` non è chiesto nel form perché è già implicito da `pickerConfig.mealRole` (passato come prop `mealRole`).
- L'oggetto `MealRecipeItem` costruito ha esattamente la stessa shape di quelle generate dall'AI con `recipe_id: 'new'`, ma `source: 'user'`. Questo permetterà alla save action (dopo il fix del Task 8) di inserirle nel DB con `source='user'`.

- [ ] **Step 5: Verificare il typecheck**

Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 6: Verificare in browser (senza ancora salvare)**

Run `npm run dev`. Apri `/planner`, riapri o genera una bozza.

1. In un pasto, clicca `+ Main`. Si apre il picker. In alto a destra: bottone "Crea nuova".
2. Clicca "Crea nuova": la view cambia, search sparisce, appare il form (nome, classi, ingredienti).
3. Submit con campi vuoti: appare l'errore "Il nome è obbligatorio".
4. Submit senza classi: appare "Seleziona almeno una classe nutrizionale".
5. Submit senza ingredienti: appare "Inserisci almeno un ingrediente".
6. Compila tutto (es. "Pasta al pomodoro", classi: carbs+veg, ingredienti: "pasta, pomodoro, basilico") e submit. La dialog si chiude. La nuova ricetta compare nel pasto come item draggable, con badge `main`, `carbs`, `veg`, ordinata correttamente. È trascinabile.
7. Riapri il picker, clicca "Crea nuova", clicca "Torna alla ricerca": la view torna alla search, lo stato del form viene resettato chiudendo+riaprendo la dialog (Step 2 effetto).
8. Test del reset: chiudi la dialog mentre sei nella view "create", riaprila → la dialog parte da view "search" (effetto `useEffect` su `isOpen`).

**Non salvare ancora il menu** — il save action ha ancora il bug del `source: 'ai'` hardcoded che fixiamo nel Task 8.

- [ ] **Step 7: Commit**

```bash
git add components/RecipePickerDialog.tsx
git commit -m "$(cat <<'EOF'
Aggiungi creazione ricetta inline in RecipePickerDialog

Toggle search/create nella stessa dialog, form ridotto (nome,
classi nutrizionali, ingredienti). meal_role implicito dal
contesto. La ricetta entra nella bozza con source='user' e
recipe_id='new', persistita in DB solo al save.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Far rispettare `recipe.source` nella save action

**Files:**
- Modify: `app/actions/menu-actions.ts:343-358`

- [ ] **Step 1: Sostituire l'insert hardcoded `source: 'ai'`**

Apri `app/actions/menu-actions.ts`. Trova il blocco `.insert({ ... })` dentro `saveWeeklyPlanAction`, sotto `// 1. Process AI recipes`. È nell'`else` del check `if (existingRecipe)`. Oggi è:

```ts
const { data: newRecipe, error: insertError } = await supabase
  .from('recipes')
  .insert({
    name: recipe.name,
    meal_role: recipe.meal_role as RecipeRole,
    nutritional_classes: recipe.nutritional_classes as NutritionalClassDB[],
    ingredients: recipe.ai_creation_data?.ingredients.map((i: string) => ({ name: i })) || [],
    tags: recipe.ai_creation_data?.tags || [],
    source: 'ai',
    generated_at: new Date().toISOString(),
    model_name: model_name || 'unknown',
    generation_prompt_version: generation_prompt_version || PLANNER_CONFIG.PROMPT_VERSION,
    user_id: user!.id
  })
  .select()
  .single();
```

Sostituiscilo con:

```ts
const isAiRecipe = recipe.source === 'ai';
const { data: newRecipe, error: insertError } = await supabase
  .from('recipes')
  .insert({
    name: recipe.name,
    meal_role: recipe.meal_role as RecipeRole,
    nutritional_classes: recipe.nutritional_classes as NutritionalClassDB[],
    ingredients: recipe.ai_creation_data?.ingredients.map((i: string) => ({ name: i })) || [],
    tags: recipe.ai_creation_data?.tags || [],
    source: recipe.source,
    ...(isAiRecipe && {
      generated_at: new Date().toISOString(),
      model_name: model_name || 'unknown',
      generation_prompt_version: generation_prompt_version || PLANNER_CONFIG.PROMPT_VERSION,
    }),
    user_id: user!.id,
  })
  .select()
  .single();
```

Punti chiave:
- I campi `generated_at`, `model_name`, `generation_prompt_version` sono valorizzati solo per ricette AI. Per ricette user-draft restano `NULL` (o default DB). Verifica che lo schema Supabase consenta NULL per questi campi prima di procedere.

- [ ] **Step 2: Verificare lo schema DB**

Run:
```bash
PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d recipes"
```

Verifica che `generated_at`, `model_name`, `generation_prompt_version` siano nullable (colonna "Nullable" = `t` o nessun `not null`). Se uno o più sono `NOT NULL`, la save di una ricetta user-draft fallirà — in tal caso, fermati e segnala (la fix richiederebbe una migrazione DB fuori scope).

- [ ] **Step 3: Verificare il typecheck**

Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Verificare end-to-end in browser**

Run `npm run dev`. Apri `/planner`:

1. **Flow ricetta user inline → save:** crea una nuova bozza, in un pasto clicca `+ Main` → "Crea nuova", compila e aggiungi (es. nome "Test User Recipe", classi protein+veg, ingredienti "test1, test2"). Completa il resto del menu come necessario per superare la validation. Salva con "Salva Piano".
2. **Verifica DB:**
   ```bash
   PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT name, source, generated_at, model_name FROM recipes WHERE name = 'Test User Recipe';"
   ```
   Expected: 1 riga con `source = 'user'`, `generated_at IS NULL`, `model_name IS NULL`.

3. **Regressione AI flow:** crea un'altra bozza, lascia che l'AI generi un menu (le ricette AI hanno l'icona Sparkles ✨). Salva. Verifica:
   ```bash
   PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "SELECT name, source, generated_at, model_name FROM recipes WHERE source = 'ai' ORDER BY generated_at DESC LIMIT 5;"
   ```
   Expected: ricette nuove inserite con `source = 'ai'`, `generated_at` valorizzato, `model_name` valorizzato.

4. **Pulizia (opzionale):** rimuovi la ricetta di test dal DB:
   ```bash
   PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "DELETE FROM recipes WHERE name = 'Test User Recipe';"
   ```

- [ ] **Step 5: Commit**

```bash
git add app/actions/menu-actions.ts
git commit -m "$(cat <<'EOF'
Fai rispettare recipe.source nella save action

Le ricette draft create inline dall'utente vengono inserite con
source='user'. I campi AI (generated_at, model_name,
generation_prompt_version) restano NULL per le user.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Verifica integrale e regressioni

**Files:** nessuno modificato (solo QA).

- [ ] **Step 1: Eseguire la checklist manuale completa della spec**

Run `npm run dev`. Sequenzialmente, in un'unica sessione:

1. **D&D base intra-day:** trascina una ricetta da Pranzo Lunedì a Cena Lunedì.
2. **D&D cross-day:** trascina una ricetta AI da Pranzo Lunedì a Cena Giovedì. Verifica che la ricetta AI conserva il flag `source='ai'` e la rappresentazione (icona Sparkles ✨).
3. **D&D bloccato fuori casa:** marca un pasto come "Pasto fuori casa", trascina una ricetta sopra: niente highlight, niente effetto.
4. **D&D svuota sorgente:** trascina via l'unica ricetta di un pasto. Errore atteso nel pannello validation.
5. **Sort dopo D&D:** dopo ogni move, il pasto destinazione mostra main prima di side, alfabetico.
6. **Sort con cestino:** in un pasto con due main + un side, cancella il main superiore col cestino. Verifica che è cancellato quello giusto (l'altro main resta).
7. **Creazione inline + save:** crea una ricetta inline, completa il menu, salva. Verifica DB come da Task 8 step 4.
8. **Save ricetta AI:** flusso AI completo, verifica DB come da Task 8 step 4 punto 3.
9. **Picker classico:** `+ Main` con scelta da DB funziona, recipe_id popolato.
10. **Toggle fuori casa:** funziona prima e dopo D&D.
11. **Export MD del piano salvato:** lista della spesa contiene gli ingredienti delle ricette user create inline (e delle ricette esistenti / AI).
12. **History view:** apri `/history`, verifica che i piani salvati nelle prove sopra appaiano correttamente con MealDisplay che ordina main→side/alfabetico.
13. **Tastiera:** Tab fino a focus su una ricetta, Space per pickup, frecce per spostare focus tra drop zones, Space per drop. Funziona.

- [ ] **Step 2: Verificare il build di produzione**

Run:
```bash
npm run build
```

Expected: build completata senza errori. Se ci sono warning nuovi rispetto a prima, valutarli.

- [ ] **Step 3: (Opzionale) Pulizia dati di test**

Rimuovi eventuali ricette / piani di test creati durante la verifica.

- [ ] **Step 4: Nessun commit qui** — questo task è solo verifica. Se trovi bug, sistema il task corrispondente prima di considerare il piano chiuso.

---

## Spec coverage check

| Requisito spec | Task |
|---|---|
| D&D tra qualsiasi pasto della settimana, semantica move | Task 5 + Task 6 |
| `@dnd-kit` come libreria | Task 1 + Task 5 + Task 6 |
| Drop bloccato su "Pasto fuori casa" | Task 5 (Step 2) |
| `activationConstraint: { distance: 5 }` per non interferire col cestino | Task 6 (Step 2) |
| Visual feedback: ring su drop zone valida, opacity sulla source, DragOverlay | Task 5 (Step 3, Step 4) + Task 6 (Step 4) |
| `KeyboardSensor` per accessibilità | Task 6 (Step 2) |
| Ordinamento main→side / alfabetico, render-time | Task 2 + Task 3 + Task 4 |
| `originalIndex` preservato per `removeRecipe` | Task 4 (Step 1) |
| Sort applicato anche in vista read-only | Task 3 (su `MealDisplay`) |
| Creazione ricetta inline come bozza, dentro `RecipePickerDialog` | Task 7 |
| Form ridotto: solo nome, classi, ingredienti | Task 7 (Step 4) |
| `meal_role` implicito dal contesto | Task 7 (Step 3) |
| Save action onora `recipe.source` invece di hardcodare 'ai' | Task 8 |
| Niente migrazioni DB | (verifica in Task 8 Step 2) |
| Niente breaking change al payload localStorage | (nessuna modifica a `useLocalStorageDraft` o schema Zod) |

---

## Riepilogo file e modifiche

- `package.json` — Task 1 (3 dependencies aggiunte)
- `lib/planner-utils.ts` — Task 2 (1 export aggiunta)
- `components/MealDisplay.tsx` — Task 3 (sort esistente sostituito col comparator condiviso)
- `components/MealEditor.tsx` — Task 4 (sort + originalIndex) + Task 5 (droppable + draggable)
- `components/PlannerClient.tsx` — Task 5 (props passate al MealEditor) + Task 6 (DndContext + handlers)
- `components/RecipePickerDialog.tsx` — Task 7 (toggle search/create + mini form)
- `app/actions/menu-actions.ts` — Task 8 (fix `source` hardcoded)
