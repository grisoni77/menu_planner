'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { RecipeCard } from "@/components/RecipeCard"
import { PantryItemCard } from "@/components/PantryItemCard"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { ImportRecipesModal } from "@/components/ImportRecipesModal"
import { PantryItemFormModal } from "@/components/PantryItemFormModal"
import { ImportPantryModal } from "@/components/ImportPantryModal"

interface DashboardClientProps {
  initialPantryItems: any[]
  initialRecipes: any[]
}

export function DashboardClient({ initialPantryItems, initialRecipes }: DashboardClientProps) {
  const [recipeSearch, setRecipeSearch] = useState("")
  const [pantrySearch, setPantrySearch] = useState("")

  const filteredRecipes = initialRecipes.filter(recipe => {
    const search = recipeSearch.toLowerCase()
    const nameMatch = recipe.name.toLowerCase().includes(search)
    const tagMatch = recipe.tags?.some((tag: string) => tag.toLowerCase().includes(search))
    return nameMatch || tagMatch
  })

  const filteredPantry = initialPantryItems.filter(item => {
    return item.name.toLowerCase().includes(pantrySearch.toLowerCase())
  })

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
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-6">
              <CardTitle>Dispensa</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca ingrediente..."
                    className="pl-9 w-full sm:w-64"
                    value={pantrySearch}
                    onChange={(e) => setPantrySearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <ImportPantryModal />
                  <PantryItemFormModal />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPantry.map((item) => (
                  <PantryItemCard key={item.id} item={item} />
                ))}
              </div>
              {filteredPantry.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  {pantrySearch ? "Nessun ingrediente trovato." : "La dispensa è vuota."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 pb-6">
              <CardTitle>Le mie Ricette</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o tag..."
                    className="pl-9 w-full sm:w-64"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <ImportRecipesModal />
                  <RecipeFormModal />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
              {filteredRecipes.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  {recipeSearch ? "Nessuna ricetta trovata." : "Nessuna ricetta salvata."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
