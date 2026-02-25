import { supabase } from "@/lib/supabase";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const [
    { data: pantryItems },
    { data: recipes },
    { data: familyProfile },
  ] = await Promise.all([
    supabase.from('pantry_items').select('*').order('name'),
    supabase.from('recipes').select('*').order('name'),
    supabase.from('family_profile').select('profile_text').eq('id', 'default').single(),
  ]);

  return (
    <DashboardClient
      initialPantryItems={pantryItems || []}
      initialRecipes={recipes || []}
      initialFamilyProfile={familyProfile?.profile_text ?? ""}
    />
  );
}
