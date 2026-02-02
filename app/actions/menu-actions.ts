'use server'

import { ChatGroq } from "@langchain/groq";
import { WeeklyPlanSchema } from "@/types/weekly-plan";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/supabase";

type RecipeRole = Database['public']['Enums']['recipe_role'];
type NutritionalClassDB = Database['public']['Enums']['nutritional_class'];
type RecipeSourceDB = Database['public']['Enums']['recipe_source'];

export async function generateMenuAction(extraNotes: string) {
  try {
    // 1. Data Fetching
    const { data: pantryItems } = await supabase.from('pantry_items').select('*');
    const { data: recipes } = await supabase.from('recipes').select('*');
    const { data: lastPlan } = await (supabase.from('weekly_plans') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 2. Context Assembly
    const pantryContext = pantryItems?.map((item: any) => `- ${item.name} (${item.quantity})`).join('\n') || 'Vuota';
    const recipesContext = recipes?.map((r: any) => {
      return `ID: ${r.id}
Name: ${r.name}
Role: ${r.meal_role}
Classes: [${r.nutritional_classes?.join(', ')}]
Ingredients: ${JSON.stringify(r.ingredients)}`;
    }).join('\n---\n') || 'Nessuna ricetta salvata';

    const lastMenuContext = lastPlan ? JSON.stringify(lastPlan.menu_data) : 'Nessun menu precedente disponibile';

    const prompt = `
      Sei un assistente esperto nella pianificazione di menu settimanali salutari e bilanciati. Version: planner-v2.0
      Il tuo obiettivo è creare un menu per la settimana (7 giorni, pranzo e cena) ottimizzando l'uso degli ingredienti già presenti in dispensa.

      REGOLE DI COMPOSIZIONE (COVERAGE):
      Ogni singolo pasto (pranzo o cena) deve essere composto da una o più ricette che, insieme, COPRONO SEMPRE queste tre classi nutrizionali:
      1. veg (Verdure)
      2. carbs (Carboidrati)
      3. protein (Proteine)
      
      REGOLE DI COMPOSIZIONE (SCELTA RICETTE):
      - DAI MAGGIORE PRIORITÀ alle ricette disponibili nel database.
      - Struttura del pasto:
        - Deve includere 1 ricetta main.
        - Deve includere almeno 1 ricetta side, A MENO CHE la ricetta main copra già veg+carbs+protein da sola.
      - Se dopo aver scelto il main manca una classe nutrizionale, DEVI aggiungere un side sostanzioso della classe mancante (non “micro porzioni”).
      - Varietà:
        - Vietato usare lo stesso main (stesso recipe_id o stesso nome per ricette AI) più di 2 volte nella settimana.
        - Vietato usare la stessa ricetta (recipe_id) più di 2 volte nella settimana complessiva.

      DISPENSA ATTUALE:
      ${pantryContext}

      RICETTE DISPONIBILI NEL DATABASE (Dai priorità a queste):
      ${recipesContext}

      MENU DELLA SETTIMANA PRECEDENTE (VARIA RISPETTO A QUESTO):
      ${lastMenuContext}

      NOTE EXTRA DALL'UTENTE:
      ${extraNotes}

      ISTRUZIONI VINCOLANTI:
      1. Per ogni ricetta selezionata dal DATABASE, devi assolutamente restituire il suo "recipe_id" originale.
      2. Se non ci sono ricette adatte nel database, inventa nuove ricette semplici coerenti con la dispensa.
      3. Per le ricette inventate (AI):
         - Imposta "recipe_id" a "new"
         - Imposta "source" a "ai"
         - Fornisci "ai_creation_data" con "ingredients" e "tags" (es. veloce, economico, forno).
      4. Genera una shopping_list aggregata per ingrediente. Per ogni voce della shopping list, includi gli ID delle ricette che richiedono quell'ingrediente. Se la ricetta è nuova, usa il nome della ricetta come riferimento temporaneo nell'array recipe_ids.
      5. Rispondi in Italiano.
    `;

    // 3. LLM Call with Structured Output
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    }).withStructuredOutput(WeeklyPlanSchema);

    const result = await model.invoke(prompt);
    console.info("LLM Result:", result);

    // 4. Process AI Recipes & Normalize IDs
    const finalWeeklyMenu = [...result.weekly_menu];
    const aiRecipeMapping = new Map<string, string>(); // AI Name -> Real ID

    for (const day of finalWeeklyMenu) {
      for (const meal of [day.lunch, day.dinner]) {
        for (const recipe of meal.recipes) {
          if (recipe.source === 'ai' || recipe.recipe_id === 'new') {
            const normalizedName = recipe.name.trim().toLowerCase().replace(/\s+/g, ' ');
            
            // Check if this AI recipe was already created/found in this session
            if (aiRecipeMapping.has(normalizedName)) {
              recipe.recipe_id = aiRecipeMapping.get(normalizedName)!;
              continue;
            }

            // Check if it exists in DB (even if AI proposed it as new)
            const { data: existingRecipe } = await supabase
              .from('recipes')
              .select('id')
              .ilike('name', normalizedName)
              .maybeSingle();

            if (existingRecipe) {
              recipe.recipe_id = existingRecipe.id;
              aiRecipeMapping.set(normalizedName, existingRecipe.id);
            } else {
              // Insert new AI recipe
              const { data: newRecipe, error: insertError } = await supabase
                .from('recipes')
                .insert({
                  name: recipe.name,
                  meal_role: recipe.meal_role as RecipeRole,
                  nutritional_classes: recipe.nutritional_classes as NutritionalClassDB[],
                  ingredients: recipe.ai_creation_data?.ingredients || [],
                  tags: recipe.ai_creation_data?.tags || [],
                  source: 'ai',
                  generated_at: new Date().toISOString(),
                  model_name: "llama-3.3-70b-versatile",
                  generation_prompt_version: 'planner-v2.0'
                })
                .select()
                .single();

              if (!insertError && newRecipe) {
                recipe.recipe_id = newRecipe.id;
                aiRecipeMapping.set(normalizedName, newRecipe.id);
              }
            }
          }
        }
      }
    }

    // Update shopping list recipe_ids with real IDs where names were used
    const finalShoppingList = result.shopping_list.map(item => ({
      ...item,
      recipe_ids: item.recipe_ids.map(rid => {
        // If it looks like a name (not a UUID), try to find the ID from our mapping
        if (rid.length > 10 && aiRecipeMapping.has(rid.trim().toLowerCase().replace(/\s+/g, ' '))) {
          return aiRecipeMapping.get(rid.trim().toLowerCase().replace(/\s+/g, ' '))!;
        }
        return rid;
      })
    }));

    // 5. Save to DB
    const { data: savedPlan, error: saveError } = await (supabase
      .from('weekly_plans') as any)
      .insert({
        menu_data: finalWeeklyMenu as any,
        shopping_list: finalShoppingList as any,
        family_profile_text: extraNotes || "" // Snapshot of user notes as profile context
      })
      .select()
      .single();

    if (saveError) {
      console.error("Errore nel salvataggio del piano:", saveError);
      throw new Error("Errore nel salvataggio del piano");
    }

    revalidatePath('/');
    return { success: true, plan: savedPlan };

  } catch (error) {
    console.error("Errore durante la generazione del menu:", error);
    return { success: false, error: "Si è verificato un errore durante la generazione del menu." };
  }
}

export async function addPantryItemAction(formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const quantity = formData.get('quantity') as string;
  const category = formData.get('category') as string;

  const { error } = await (supabase.from('pantry_items') as any).insert({ name, quantity, category } as any);
  if (error && error.code === '23505') {
    return { success: false, error: "Un ingrediente con questo nome esiste già." };
  }
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

export async function updatePantryItemAction(id: string, formData: FormData) {
  const name = (formData.get('name') as string).trim();
  const quantity = formData.get('quantity') as string;
  const category = formData.get('category') as string;

  const { error } = await (supabase.from('pantry_items') as any).update({ name, quantity, category } as any).eq('id', id);
  if (error && error.code === '23505') {
    return { success: false, error: "Un ingrediente con questo nome esiste già." };
  }
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true };
}

export async function deletePantryItemAction(id: string) {
  await supabase.from('pantry_items').delete().eq('id', id);
  revalidatePath('/dashboard');
  revalidatePath('/');
}

export async function addRecipeAction(formData: FormData) {
    const name = (formData.get('name') as string).trim();
    const ingredientsRaw = formData.get('ingredients') as string;
    const tagsRaw = formData.get('tags') as string;
    const meal_role = (formData.get('meal_role') as RecipeRole) || 'main';
    const nutritional_classes = formData.getAll('nutritional_classes') as NutritionalClassDB[];
    
    const ingredients = ingredientsRaw.split(',').map(i => ({ name: i.trim() })).filter(i => i.name);
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);

    const { error } = await supabase.from('recipes').insert({ 
        name, 
        ingredients: ingredients as any, 
        tags,
        meal_role,
        nutritional_classes,
        source: 'user' as RecipeSourceDB
    });
    if (error && error.code === '23505') {
      return { success: false, error: "Una ricetta con questo nome esiste già." };
    }
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
}

export async function updateRecipeAction(id: string, formData: FormData) {
    const name = (formData.get('name') as string).trim();
    const ingredientsRaw = formData.get('ingredients') as string;
    const tagsRaw = formData.get('tags') as string;
    const meal_role = (formData.get('meal_role') as RecipeRole);
    const nutritional_classes = formData.getAll('nutritional_classes') as NutritionalClassDB[];
    
    const ingredients = ingredientsRaw.split(',').map(i => ({ name: i.trim() })).filter(i => i.name);
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);

    const updateData: any = { name, ingredients, tags };
    if (meal_role) updateData.meal_role = meal_role;
    updateData.nutritional_classes = nutritional_classes;

    const { error } = await supabase.from('recipes').update(updateData).eq('id', id);
    if (error && error.code === '23505') {
      return { success: false, error: "Una ricetta con questo nome esiste già." };
    }
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
}

export async function deleteRecipeAction(id: string) {
    await supabase.from('recipes').delete().eq('id', id);
    revalidatePath('/dashboard');
    revalidatePath('/');
}

export async function importRecipesAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Nessun file fornito" };

  try {
    const content = await file.text();
    const lines = content.split('\n');
    
    const recipesToInsert: Database['public']['Tables']['recipes']['Insert'][] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Gestione migliore del CSV con campi virgolettati
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());

      if (parts.length < 2) continue;

      const name = parts[0].replace(/^"|"$/g, '').trim();
      const ingredientsRaw = parts[1].replace(/^"|"$/g, '').trim();
      const tagsRaw = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : "";
      const mealRoleRaw = parts[3] ? parts[3].replace(/^"|"$/g, '').toLowerCase().trim() : "main";
      const classesRaw = parts[4] ? parts[4].replace(/^"|"$/g, '').toLowerCase().trim() : "";

      const ingredients = ingredientsRaw.split(/[;,]/).map(ing => ({ name: ing.trim() })).filter(ing => ing.name);
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];
      const meal_role = (mealRoleRaw === 'side' || mealRoleRaw === 'main') ? (mealRoleRaw as RecipeRole) : 'main';
      const nutritional_classes = classesRaw ? classesRaw.split(',').map(c => c.trim()).filter(c => ['veg', 'carbs', 'protein'].includes(c)) as NutritionalClassDB[] : [];

      recipesToInsert.push({ 
        name, 
        ingredients: ingredients as any, 
        tags, 
        meal_role, 
        nutritional_classes,
        source: 'user' as RecipeSourceDB
      });
    }

    if (recipesToInsert.length > 0) {
      const { error } = await supabase.from('recipes').upsert(recipesToInsert as any, { onConflict: 'name' });
      if (error) throw error;
    }

    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, count: recipesToInsert.length };
  } catch (error) {
    console.error("Errore durante l'importazione CSV:", error);
    return { success: false, error: "Errore durante l'elaborazione del file CSV" };
  }
}

export async function importPantryItemsAction(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) return { success: false, error: "Nessun file fornito" };

  try {
    const content = await file.text();
    const lines = content.split('\n');
    
    const itemsToInsert = [];
    
    // Header: nome,quantità,categoria
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Gestione migliore del CSV con campi virgolettati
      const parts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      parts.push(currentPart.trim());

      if (parts.length < 1) continue;

      const name = parts[0].replace(/^"|"$/g, '').trim();
      const quantity = parts[1] ? parts[1].replace(/^"|"$/g, '').trim() : "";
      const category = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : "";

      itemsToInsert.push({ name, quantity, category });
    }

    if (itemsToInsert.length > 0) {
      const { error } = await supabase.from('pantry_items').upsert(itemsToInsert, { onConflict: 'name' });
      if (error) throw error;
    }

    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, count: itemsToInsert.length };
  } catch (error) {
    console.error("Errore durante l'importazione CSV dispensa:", error);
    return { success: false, error: "Errore durante l'elaborazione del file CSV" };
  }
}

export async function getWeeklyPlansAction() {
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Errore nel recupero dello storico:", error);
    return { success: false, error: "Impossibile recuperare lo storico" };
  }

  return { success: true, plans: data };
}
