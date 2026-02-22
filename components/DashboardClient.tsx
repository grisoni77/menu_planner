'use client'

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, LayoutGrid, List, ArrowUp, ArrowDown, Trash2, Sparkles } from "lucide-react"
import { RecipeCard } from "@/components/RecipeCard"
import { PantryItemCard } from "@/components/PantryItemCard"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { ImportRecipesModal } from "@/components/ImportRecipesModal"
import { PantryItemFormModal } from "@/components/PantryItemFormModal"
import { ImportPantryModal } from "@/components/ImportPantryModal"
import { ExportButton } from "@/components/ExportButton"
import { Badge } from "@/components/ui/badge"
import { deleteRecipeAction } from "@/app/actions/menu-actions"

type ViewMode = 'card' | 'table'
type SortOrder = 'asc' | 'desc'

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
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

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

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const filteredRecipes = initialRecipes.filter(recipe => {
    const search = recipeSearch.toLowerCase()
    const nameMatch = recipe.name.toLowerCase().includes(search)

    const tagsMatch = selectedTags.length === 0 ||
      selectedTags.every(tag => recipe.tags?.includes(tag))

    const roleMatch = selectedRoles.length === 0 ||
      selectedRoles.includes(recipe.meal_role)

    const nutritionalMatch = selectedNutritional.length === 0 ||
      selectedNutritional.every(cls => recipe.nutritional_classes?.includes(cls))

    const seasonMatch = selectedSeasons.length === 0 ||
      recipe.seasons?.length === 0 ||
      selectedSeasons.some(season => recipe.seasons?.includes(season))

    return nameMatch && tagsMatch && roleMatch && nutritionalMatch && seasonMatch
  })

  const sortedRecipes = useMemo(() => {
    return [...filteredRecipes].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'it')
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [filteredRecipes, sortOrder])

  const filteredPantry = initialPantryItems.filter(item => {
    return item.name.toLowerCase().includes(pantrySearch.toLowerCase())
  })

  const hasActiveFilters = selectedTags.length > 0 || selectedRoles.length > 0 || selectedNutritional.length > 0 || selectedSeasons.length > 0

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
            <CardHeader className="pb-4 space-y-0">
              {/* Row 1: Title + view toggle (always top-right) */}
              <div className="flex items-center justify-between">
                <CardTitle>Le mie Ricette</CardTitle>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('card')}
                    title="Vista a card"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('table')}
                    title="Vista a tabella"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Filters (flex-wrap to avoid overflow on mobile) */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-3">
                <span className="text-[11px] text-muted-foreground uppercase font-bold">Tipo:</span>
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
                <span className="text-[11px] text-muted-foreground uppercase font-bold">Nutr:</span>
                {[
                  { id: 'veg', label: 'Veg', color: 'green' },
                  { id: 'carbs', label: 'Carbs', color: 'amber' },
                  { id: 'protein', label: 'Prot', color: 'red' }
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
                <span className="text-[11px] text-muted-foreground uppercase font-bold">Stag:</span>
                {['Primavera', 'Estate', 'Autunno', 'Inverno'].map(season => (
                  <Badge
                    key={season}
                    variant={selectedSeasons.includes(season) ? "default" : "outline"}
                    className={`cursor-pointer text-[10px] px-2 py-0 h-5 transition-colors ${
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

              {/* Row 3: Search + Actions (flex-wrap to avoid overflow on mobile) */}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o tag..."
                    className="pl-9 w-full"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                  />
                </div>
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
              {hasActiveFilters && (
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

              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th
                          className="text-left py-2.5 px-3 font-medium text-sm cursor-pointer select-none hover:bg-muted/60 transition-colors"
                          onClick={toggleSort}
                        >
                          <div className="flex items-center gap-1">
                            Nome
                            {sortOrder === 'asc'
                              ? <ArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
                              : <ArrowDown className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </div>
                        </th>
                        <th className="text-left py-2.5 px-3 font-medium text-sm">
                          Tipo & Classi
                        </th>
                        <th className="text-right py-2.5 px-3 font-medium text-sm">
                          Azioni
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRecipes.map((recipe) => (
                        <tr key={recipe.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {recipe.name}
                              {recipe.source === 'ai' && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 flex gap-1 items-center px-1.5 py-0 h-4 shrink-0">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  AI
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {recipe.meal_role && (
                                <button
                                  onClick={() => toggleRole(recipe.meal_role)}
                                  className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors ${
                                    selectedRoles.includes(recipe.meal_role)
                                      ? (recipe.meal_role === 'main' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200')
                                      : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
                                  }`}
                                >
                                  {recipe.meal_role}
                                </button>
                              )}
                              {recipe.nutritional_classes?.map((cls: string) => {
                                const isSelected = selectedNutritional.includes(cls)
                                const colors: Record<string, string> = {
                                  veg: isSelected ? 'bg-green-50 text-green-700 border-green-200' : 'hover:bg-green-50 hover:text-green-700 text-green-600 border-green-200',
                                  carbs: isSelected ? 'bg-amber-50 text-amber-700 border-amber-200' : 'hover:bg-amber-50 hover:text-amber-700 text-amber-600 border-amber-200',
                                  protein: isSelected ? 'bg-red-50 text-red-700 border-red-200' : 'hover:bg-red-50 hover:text-red-700 text-red-600 border-red-200'
                                }
                                const colorClass = colors[cls] || 'bg-white text-muted-foreground border-input'
                                return (
                                  <button
                                    key={cls}
                                    onClick={() => toggleNutritional(cls)}
                                    className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors ${colorClass}`}
                                  >
                                    {cls}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex gap-1 justify-end">
                              <RecipeFormModal recipe={recipe as any} />
                              <form action={deleteRecipeAction.bind(null, recipe.id)}>
                                <Button variant="ghost" size="icon" type="submit">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sortedRecipes.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      {recipeSearch ? "Nessuna ricetta trovata." : "Nessuna ricetta salvata."}
                    </p>
                  )}
                </div>
              ) : (
                <>
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
                  {filteredRecipes.length === 0 && (
                    <p className="text-center text-muted-foreground py-12">
                      {recipeSearch ? "Nessuna ricetta trovata." : "Nessuna ricetta salvata."}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
