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
    const pantryContext = pantryItems?.map((item: any) => `${item.name} (${item.quantity})`).join(', ') || 'Vuota';
    const recipesContext = recipes?.map((r: any) => `${r.name}: ${JSON.stringify(r.ingredients)}`).join('\n') || 'Nessuna ricetta salvata';
    const lastMenuContext = lastPlan ? JSON.stringify(lastPlan.menu_data) : 'Nessun menu precedente disponibile';

    const prompt = `
      Sei un assistente esperto nella pianificazione di menu settimanali salutari e bilanciati.
      Il tuo obiettivo è creare un menu per la settimana (7 giorni, pranzo e cena) ottimizzando l'uso degli ingredienti già presenti in dispensa.

      IMPORTANTE - STRUTTURA DEL PASTO:
      Ogni singolo pasto (sia pranzo che cena) deve essere composto da tre componenti specifiche rispettando queste proporzioni:
      1. Verdure (50% del piatto)
      2. Carboidrati (30% del piatto)
      3. Proteine (20% del piatto)

      Assicurati che per ogni pasto tu fornisca esplicitamente cosa mangiare per ciascuna di queste tre categorie.

      DISPENSA ATTUALE:
      ${pantryContext}

      RICETTE DISPONIBILI NEL DATABASE:
      ${recipesContext}

      MENU DELLA SETTIMANA PRECEDENTE (EVITA DI RIPETERE GLI STESSI PIATTI):
      ${lastMenuContext}

      NOTE EXTRA DALL'UTENTE:
      ${extraNotes}

      ISTRUZIONI:
      1. Dai la priorità alle RICETTE DISPONIBILI nel database se gli ingredienti sono in gran parte presenti in dispensa. Se una ricetta del database è un piatto unico, scomponilo o integralo per rispettare la suddivisione Verdure/Carboidrati/Proteine.
      2. Se non ci sono abbastanza ricette nel database o per variare, inventa piatti semplici coerenti con la dispensa.
      3. Se mancano ingredienti per una ricetta che hai scelto, aggiungili alla shopping_list.
      4. Sii preciso sulle quantità.
      5. CERCA DI VARIARE rispetto al menu della settimana precedente fornito.
      6. Rispondi in Italiano.
    `;

    // 3. LLM Call with Structured Output
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    }).withStructuredOutput(WeeklyPlanSchema);

    const result = await model.invoke(prompt);

    // 4. Save to DB
    const { data: savedPlan, error: saveError } = await (supabase
      .from('weekly_plans') as any)
      .insert({
        menu_data: result.weekly_menu as any,
        shopping_list: result.shopping_list as any,
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
