'use server'

import { ChatGroq } from "@langchain/groq";
import { WeeklyPlanSchema } from "@/types/weekly-plan";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function generateMenuAction(extraNotes: string) {
  try {
    // 1. Data Fetching
    const { data: pantryItems } = await supabase.from('pantry_items').select('*');
    const { data: recipes } = await supabase.from('recipes').select('*');

    // 2. Context Assembly
    const pantryContext = pantryItems?.map((item: any) => `${item.name} (${item.quantity})`).join(', ') || 'Vuota';
    const recipesContext = recipes?.map((r: any) => `${r.name}: ${JSON.stringify(r.ingredients)}`).join('\n') || 'Nessuna ricetta salvata';

    const prompt = `
      Sei un assistente esperto nella pianificazione di menu settimanali.
      Il tuo obiettivo è creare un menu per la settimana (7 giorni, pranzo e cena) ottimizzando l'uso degli ingredienti già presenti in dispensa.

      DISPENSA ATTUALE:
      ${pantryContext}

      RICETTE DISPONIBILI NEL DATABASE:
      ${recipesContext}

      NOTE EXTRA DALL'UTENTE:
      ${extraNotes}

      ISTRUZIONI:
      1. Dai la priorità alle RICETTE DISPONIBILI nel database se gli ingredienti sono in gran parte presenti in dispensa.
      2. Se non ci sono abbastanza ricette nel database o per variare, inventa piatti semplici coerenti con la dispensa.
      3. Se mancano ingredienti per una ricetta che hai scelto, aggiungili alla shopping_list.
      4. Sii preciso sulle quantità.
      5. Rispondi in Italiano.
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
  const name = formData.get('name') as string;
  const quantity = formData.get('quantity') as string;
  const category = formData.get('category') as string;

  await (supabase.from('pantry_items') as any).insert({ name, quantity, category } as any);
  revalidatePath('/');
}

export async function deletePantryItemAction(id: string) {
  await supabase.from('pantry_items').delete().eq('id', id);
  revalidatePath('/');
}

export async function addRecipeAction(formData: FormData) {
    const name = formData.get('name') as string;
    const ingredientsRaw = formData.get('ingredients') as string;
    const tagsRaw = formData.get('tags') as string;
    
    const ingredients = ingredientsRaw.split(',').map(i => ({ name: i.trim() }));
    const tags = tagsRaw.split(',').map(t => t.trim());

    await (supabase.from('recipes') as any).insert({ name, ingredients, tags } as any);
    revalidatePath('/');
}
