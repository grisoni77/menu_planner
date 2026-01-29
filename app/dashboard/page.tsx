import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const { data: pantryItems } = await supabase.from('pantry_items').select('*').order('name');
  const { data: recipes } = await supabase.from('recipes').select('*').order('name');

  return (
    <DashboardClient 
      initialPantryItems={pantryItems || []} 
      initialRecipes={recipes || []} 
    />
  );
}
