'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X } from "lucide-react"
import { RecipeCard } from "@/components/RecipeCard"
import { PantryItemCard } from "@/components/PantryItemCard"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { ImportRecipesModal } from "@/components/ImportRecipesModal"
import { PantryItemFormModal } from "@/components/PantryItemFormModal"
import { ImportPantryModal } from "@/components/ImportPantryModal"
import { Badge } from "@/components/ui/badge"

interface DashboardClientProps {
  initialPantryItems: any[]
  initialRecipes: any[]
}

export function DashboardClient({ initialPantryItems, initialRecipes }: DashboardClientProps) {
  const [recipeSearch, setRecipeSearch] = useState("")
  const [pantrySearch, setPantrySearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  const filteredRecipes = initialRecipes.filter(recipe => {
    const search = recipeSearch.toLowerCase()
    const nameMatch = recipe.name.toLowerCase().includes(search)
    
    // Il testo nel campo ricerca attiva la ricerca SOLO sul nome (come da richiesta)
    // Se ci sono tag selezionati, la ricetta deve averli TUTTI
    const tagsMatch = selectedTags.length === 0 || 
      selectedTags.every(tag => recipe.tags?.includes(tag))

    return nameMatch && tagsMatch
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
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      {tag}
                      <button 
                        onClick={() => toggleTag(tag)}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedTags([])}
                    className="h-8 px-2 text-xs"
                  >
                    Svuota filtri
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onTagClick={toggleTag}
                    selectedTags={selectedTags}
                  />
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
