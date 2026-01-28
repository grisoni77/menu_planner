import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPantryItemAction, deletePantryItemAction, addRecipeAction } from "@/app/actions/menu-actions";
import { Trash2 } from "lucide-react";

export default async function DashboardPage() {
  const { data: pantryItems } = await supabase.from('pantry_items').select('*').order('name');
  const { data: recipes } = await supabase.from('recipes').select('*').order('name');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Dispensa</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Dispensa */}
        <Card>
          <CardHeader>
            <CardTitle>Dispensa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addPantryItemAction} className="flex gap-2">
              <Input name="name" placeholder="Nome ingrediente" required />
              <Input name="quantity" placeholder="Quantità" className="w-24" />
              <Button type="submit">Aggiungi</Button>
            </form>

            <ul className="divide-y">
              {pantryItems?.map((item: any) => (
                <li key={item.id} className="py-2 flex justify-between items-center">
                  <span>{item.name} <span className="text-muted-foreground text-sm">({item.quantity})</span></span>
                  <form action={deletePantryItemAction.bind(null, item.id)}>
                    <Button variant="ghost" size="icon" type="submit">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </form>
                </li>
              ))}
              {pantryItems?.length === 0 && <p className="text-muted-foreground">La dispensa è vuota.</p>}
            </ul>
          </CardContent>
        </Card>

        {/* Ricette */}
        <Card>
          <CardHeader>
            <CardTitle>Le mie Ricette</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={addRecipeAction} className="space-y-2">
              <Input name="name" placeholder="Nome ricetta" required />
              <Input name="ingredients" placeholder="Ingredienti (separati da virgola)" required />
              <Input name="tags" placeholder="Tag (separati da virgola)" />
              <Button type="submit" className="w-full">Salva Ricetta</Button>
            </form>

            <ul className="divide-y">
              {recipes?.map((recipe: any) => (
                <li key={recipe.id} className="py-2">
                  <div className="font-medium">{recipe.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {Array.isArray(recipe.tags) && recipe.tags.join(', ')}
                  </div>
                </li>
              ))}
              {recipes?.length === 0 && <p className="text-muted-foreground">Nessuna ricetta salvata.</p>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
