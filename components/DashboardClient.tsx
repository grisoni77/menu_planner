'use client'

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, LayoutGrid, Table, ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from "lucide-react"
import { getNutritionalClassColor, getMealRoleColor } from "@/lib/recipe-colors"
import { RecipeCard } from "@/components/RecipeCard"
import { PantryItemCard } from "@/components/PantryItemCard"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { ImportRecipesModal } from "@/components/ImportRecipesModal"
import { PantryItemFormModal } from "@/components/PantryItemFormModal"
import { ImportPantryModal } from "@/components/ImportPantryModal"
import { ExportButton } from "@/components/ExportButton"
import { DeleteRecipeButton } from "@/components/DeleteRecipeButton"
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
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

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

  const toggleSeason = (season: string) => {
    setSelectedSeasons(prev =>
      prev.includes(season)
        ? prev.filter(s => s !== season)
        : [...prev, season]
    )
  }

  const filteredRecipes = useMemo(() => initialRecipes.filter(recipe => {
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

    // Filtro per stagionalità (OR - se selezionate più stagioni, mostra ricette valide per almeno una di esse)
    // Se la ricetta non ha stagioni (array vuoto), è valida per tutte le stagioni.
    const seasonMatch = selectedSeasons.length === 0 ||
      recipe.seasons?.length === 0 ||
      selectedSeasons.some(season => recipe.seasons?.includes(season))

    return nameMatch && tagsMatch && roleMatch && nutritionalMatch && seasonMatch
  }), [initialRecipes, recipeSearch, selectedTags, selectedRoles, selectedNutritional, selectedSeasons])

  const sortedRecipes = useMemo(() => {
    if (!sortDirection) return filteredRecipes
    return [...filteredRecipes].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'it')
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [filteredRecipes, sortDirection])

  const toggleSort = () => {
    setSortDirection(prev => {
      if (prev === null) return 'asc'
      if (prev === 'asc') return 'desc'
      return null
    })
  }

  const filteredPantry = initialPantryItems.filter(item => {
    return item.name.toLowerCase().includes(pantrySearch.toLowerCase())
  })

  const nutritionalClasses = [
    {id: 'veg', label: 'Veg', color: 'green'},
    {id: 'carbs', label: 'Carbs', color: 'amber'},
    {id: 'protein', label: 'Prot', color: 'red'}
  ]

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
            <CardHeader className="flex flex-col space-y-4 pb-6">
              {/* Riga 1: Titolo + Toggle vista */}
              <div className="flex items-center justify-between">
                <CardTitle>Le mie Ricette</CardTitle>
                <div className="flex gap-0.5 border rounded-md p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${viewMode === 'cards' ? 'bg-secondary' : ''}`}
                    onClick={() => setViewMode('cards')}
                    title="Vista card"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${viewMode === 'table' ? 'bg-secondary' : ''}`}
                    onClick={() => setViewMode('table')}
                    title="Vista tabella"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Riga 2: Filtri badge — scrollabili orizzontalmente su mobile */}
              <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center gap-2 flex-nowrap min-w-max">
                  <span className="text-[11px] text-muted-foreground uppercase font-bold mr-1">Tipo:</span>
                  {['main', 'side'].map(role => (
                    <Badge
                      key={role}
                      variant={selectedRoles.includes(role) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0 h-5 capitalize transition-colors whitespace-nowrap ${
                        selectedRoles.includes(role)
                          ? getMealRoleColor(role, 'button')
                          : getMealRoleColor(role, 'buttonInactive')
                      }`}
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </Badge>
                  ))}
                  <span className="text-[11px] text-muted-foreground uppercase font-bold ml-2 mr-1">Nutr:</span>
                  {nutritionalClasses.map(cls => (
                    <Badge
                      key={cls.id}
                      variant={selectedNutritional.includes(cls.id) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0 h-5 transition-colors whitespace-nowrap ${
                        selectedNutritional.includes(cls.id)
                          ? getNutritionalClassColor(cls.id, 'button')
                          : getNutritionalClassColor(cls.id, 'buttonInactive')
                      }`}
                      onClick={() => toggleNutritional(cls.id)}
                    >
                      {cls.label}
                    </Badge>
                  ))}
                  <span className="text-[11px] text-muted-foreground uppercase font-bold ml-2 mr-1">Stag:</span>
                  {['Primavera', 'Estate', 'Autunno', 'Inverno'].map(season => (
                    <Badge
                      key={season}
                      variant={selectedSeasons.includes(season) ? "default" : "outline"}
                      className={`cursor-pointer text-[10px] px-2 py-0 h-5 transition-colors whitespace-nowrap ${
                        selectedSeasons.includes(season)
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-blue-50 hover:text-blue-700 text-blue-600'
                      }`}
                      onClick={() => toggleSeason(season)}
                    >
                      {season}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Riga 3: Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome o tag..."
                  className="pl-9 w-full sm:w-64"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                />
              </div>

              {/* Riga 4: Pulsanti azione — grid 3 col icon-only su mobile */}
              <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2">
                <ExportButton
                  data={filteredRecipes}
                  filename="ricette.csv"
                  type="recipes"
                />
                <ImportRecipesModal />
                <RecipeFormModal />
              </div>
            </CardHeader>
            <CardContent>
              {(selectedTags.length > 0 || selectedRoles.length > 0 || selectedNutritional.length > 0 || selectedSeasons.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedRoles.map(role => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className={`flex items-center gap-1 px-3 py-1 ${
                        getMealRoleColor(role, 'badge')
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
                    return (
                      <Badge
                        key={cls}
                        variant="secondary"
                        className={`flex items-center gap-1 px-3 py-1 ${getNutritionalClassColor(cls, 'badge')}`}
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
                  {selectedSeasons.map(season => (
                    <Badge
                      key={season}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Stagione: {season}
                      <button
                        onClick={() => toggleSeason(season)}
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
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
                      setSelectedSeasons([])
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Svuota filtri
                  </Button>
                </div>
              )}

              {/* Vista Cards */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onTagClick={toggleTag}
                      onRoleClick={toggleRole}
                      onNutritionalClick={toggleNutritional}
                      onSeasonClick={toggleSeason}
                      selectedTags={selectedTags}
                      selectedRoles={selectedRoles}
                      selectedNutritional={selectedNutritional}
                      selectedSeasons={selectedSeasons}
                    />
                  ))}
                </div>
              )}

              {/* Vista Tabella */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium min-w-[200px]">
                          <button
                            onClick={toggleSort}
                            className="flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors"
                          >
                            Nome
                            {sortDirection === null && <ArrowUpDown className="h-3.5 w-3.5" />}
                            {sortDirection === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                            {sortDirection === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
                          </button>
                        </th>
                        <th className="text-left py-3 px-2 font-medium whitespace-nowrap">Tipo / Nutr.</th>
                        <th className="text-right py-3 px-2 font-medium w-24">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecipes.map((recipe) => {
                        const isAI = recipe.source === 'ai'
                        return (
                          <tr key={recipe.id} className={`border-b last:border-b-0 hover:bg-muted/50 ${isAI ? 'bg-purple-50/30' : ''}`}>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <span className="font-medium">{recipe.name}</span>
                                {isAI && (
                                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 flex gap-1 items-center px-1.5 py-0 shrink-0">
                                    <Sparkles className="h-3 w-3" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex gap-1 flex-wrap">
                                {recipe.meal_role && (
                                  <button
                                    onClick={() => toggleRole(recipe.meal_role)}
                                    className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors whitespace-nowrap ${
                                      selectedRoles.includes(recipe.meal_role)
                                        ? getMealRoleColor(recipe.meal_role, 'badge')
                                        : getMealRoleColor(recipe.meal_role, 'badgeInactive')
                                    }`}
                                  >
                                    {recipe.meal_role}
                                  </button>
                                )}
                                {recipe.nutritional_classes?.map((cls: string) => {
                                  const isSelected = selectedNutritional.includes(cls)
                                  const colorClass = getNutritionalClassColor(cls, isSelected ? 'badge' : 'badgeInactive')
                                  return (
                                    <button
                                      key={cls}
                                      onClick={() => toggleNutritional(cls)}
                                      className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors whitespace-nowrap ${colorClass}`}
                                    >
                                      {cls}
                                    </button>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex gap-1 justify-end">
                                <RecipeFormModal recipe={recipe} />
                                <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} className="h-8 w-8" />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

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
