import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPantryItemAction, deletePantryItemAction, deleteRecipeAction } from "@/app/actions/menu-actions";
import { Trash2 } from "lucide-react";
import { ImportRecipesForm } from "@/components/ImportRecipesForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeFormModal } from "@/components/RecipeFormModal";

export default async function DashboardPage() {
  const { data: pantryItems } = await supabase.from('pantry_items').select('*').order('name');
  const { data: recipes } = await supabase.from('recipes').select('*').order('name');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="recipes">Ricette</TabsTrigger>
          <TabsTrigger value="pantry">Dispensa</TabsTrigger>
        </TabsList>

        <TabsContent value="pantry">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
                {pantryItems?.length === 0 && <p className="text-muted-foreground text-sm py-4">La dispensa è vuota.</p>}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Le mie Ricette</CardTitle>
              <RecipeFormModal />
            </CardHeader>
            <CardContent className="space-y-4">
              <ImportRecipesForm />

              <ul className="divide-y mt-4">
                {recipes?.map((recipe: any) => (
                  <li key={recipe.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{recipe.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Array.isArray(recipe.tags) && recipe.tags.join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <RecipeFormModal recipe={recipe} />
                      <form action={deleteRecipeAction.bind(null, recipe.id)}>
                        <Button variant="ghost" size="icon" type="submit">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
                {recipes?.length === 0 && <p className="text-muted-foreground text-sm py-4">Nessuna ricetta salvata.</p>}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
