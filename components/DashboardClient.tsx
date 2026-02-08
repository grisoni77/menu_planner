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
import { ExportButton } from "@/components/ExportButton"
import { Badge } from "@/components/ui/badge"

interface DashboardClientProps {
  initialPantryItems: any[]
  initialRecipes: any[]
}

export function DashboardClient({ initialPantryItems, initialRecipes }: DashboardClientProps) {
  const [recipeSearch, setRecipeSearch] = useState("")
  const [pantrySearch, setPantrySearch] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedNutritional, setSelectedNutritional] = useState<string[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    )
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const toggleNutritional = (cls: string) => {
    setSelectedNutritional(prev =>
      prev.includes(cls)
        ? prev.filter(c => c !== cls)
        : [...prev, cls]
    )
  }

  const filteredRecipes = initialRecipes.filter(recipe => {
    const search = recipeSearch.toLowerCase()
    const nameMatch = recipe.name.toLowerCase().includes(search)
    
    // Il testo nel campo ricerca attiva la ricerca SOLO sul nome (come da richiesta)
    // Se ci sono tag selezionati, la ricetta deve averli TUTTI
    const tagsMatch = selectedTags.length === 0 || 
      selectedTags.every(tag => recipe.tags?.includes(tag))

    // Filtro per meal_role (OR se più selezionati)
    const roleMatch = selectedRoles.length === 0 ||
      selectedRoles.includes(recipe.meal_role)

    // Filtro per classi nutrizionali (AND - deve averle tutte le classi selezionate)
    const nutritionalMatch = selectedNutritional.length === 0 ||
      selectedNutritional.every(cls => recipe.nutritional_classes?.includes(cls))

    return nameMatch && tagsMatch && roleMatch && nutritionalMatch
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
                  <ExportButton 
                    data={filteredPantry} 
                    filename="dispensa.csv" 
                    type="pantry" 
                  />
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
              <div className="space-y-1">
                <CardTitle>Le mie Ricette</CardTitle>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold mr-1">Tipo:</span>
                  {['main', 'side'].map(role => (
                    <Badge 
                      key={role}
                      variant={selectedRoles.includes(role) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0 h-5 capitalize transition-colors ${
                        selectedRoles.includes(role) 
                          ? (role === 'main' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-700 hover:bg-slate-800')
                          : (role === 'main' ? 'hover:bg-indigo-50 hover:text-indigo-700' : 'hover:bg-slate-100 text-slate-600')
                      }`}
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Badge>
                  ))}
                  <span className="text-[11px] text-muted-foreground uppercase font-bold ml-2 mr-1">Nutr:</span>
                  {[
                    {id: 'veg', label: 'Veg', color: 'green'},
                    {id: 'carbs', label: 'Carbs', color: 'amber'},
                    {id: 'protein', label: 'Prot', color: 'red'}
                  ].map(cls => (
                    <Badge 
                      key={cls.id}
                      variant={selectedNutritional.includes(cls.id) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0 h-5 transition-colors ${
                        selectedNutritional.includes(cls.id) 
                          ? (cls.id === 'veg' ? 'bg-green-600 hover:bg-green-700' : cls.id === 'carbs' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700')
                          : (cls.id === 'veg' ? 'hover:bg-green-50 hover:text-green-700 text-green-600' : cls.id === 'carbs' ? 'hover:bg-amber-50 hover:text-amber-700 text-amber-600' : 'hover:bg-red-50 hover:text-red-700 text-red-600')
                      }`}
                      onClick={() => toggleNutritional(cls.id)}
                    >
                      {cls.label}
                    </Badge>
                  ))}
                </div>
              </div>
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
                  <ExportButton 
                    data={filteredRecipes} 
                    filename="ricette.csv" 
                    type="recipes" 
                  />
                  <ImportRecipesModal />
                  <RecipeFormModal />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(selectedTags.length > 0 || selectedRoles.length > 0 || selectedNutritional.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedRoles.map(role => (
                    <Badge 
                      key={role} 
                      variant="secondary" 
                      className={`flex items-center gap-1 px-3 py-1 ${
                        role === 'main' 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Tipo: {role}
                      <button 
                        onClick={() => toggleRole(role)}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                  {selectedNutritional.map(cls => {
                    const colors = {
                      veg: 'bg-green-50 text-green-700 border-green-200',
                      carbs: 'bg-amber-50 text-amber-700 border-amber-200',
                      protein: 'bg-red-50 text-red-700 border-red-200'
                    }
                    const colorClass = colors[cls as keyof typeof colors] || 'bg-slate-100 text-slate-700 border-slate-200'
                    
                    return (
                      <Badge 
                        key={cls} 
                        variant="secondary" 
                        className={`flex items-center gap-1 px-3 py-1 ${colorClass}`}
                      >
                        Nutr: {cls}
                        <button 
                          onClick={() => toggleNutritional(cls)}
                          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    )
                  })}
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
                    onClick={() => {
                      setSelectedTags([])
                      setSelectedRoles([])
                      setSelectedNutritional([])
                    }}
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
                    onRoleClick={toggleRole}
                    onNutritionalClick={toggleNutritional}
                    selectedTags={selectedTags}
                    selectedRoles={selectedRoles}
                    selectedNutritional={selectedNutritional}
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
