'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Tag, Sparkles, Info } from "lucide-react"
import { RecipeFormModal } from "./RecipeFormModal"
import { deleteRecipeAction } from "@/app/actions/menu-actions"
import { Badge } from "@/components/ui/badge"
import { NutritionalClass, MealRole, RecipeSource, Season } from "@/types/weekly-plan"

interface RecipeCardProps {
  recipe: {
    id: string
    name: string
    ingredients: { name: string }[]
    tags: string[] | null
    nutritional_classes?: NutritionalClass[]
    meal_role?: MealRole
    source?: RecipeSource
    seasons?: Season[]
  }
  onTagClick?: (tag: string) => void
  onRoleClick?: (role: string) => void
  onNutritionalClick?: (cls: string) => void
  onSeasonClick?: (season: string) => void
  selectedTags?: string[]
  selectedRoles?: string[]
  selectedNutritional?: string[]
  selectedSeasons?: string[]
}

export function RecipeCard({ 
  recipe, 
  onTagClick, 
  onRoleClick,
  onNutritionalClick,
  onSeasonClick,
  selectedTags = [],
  selectedRoles = [],
  selectedNutritional = [],
  selectedSeasons = []
}: RecipeCardProps) {
  const isAI = recipe.source === 'ai'
  const hasNoClasses = !recipe.nutritional_classes || recipe.nutritional_classes.length === 0

  return (
    <Card className={`overflow-hidden ${isAI ? 'border-purple-200 bg-purple-50/30' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight">{recipe.name}</h3>
              {isAI && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 flex gap-1 items-center px-1.5 py-0">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {recipe.meal_role && (
                <button
                  onClick={() => onRoleClick?.(recipe.meal_role!)}
                  className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors ${
                    selectedRoles.includes(recipe.meal_role)
                      ? (recipe.meal_role === 'main' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200')
                      : 'bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80'
                  }`}
                >
                  {recipe.meal_role}
                </button>
              )}
              {recipe.nutritional_classes?.map(cls => {
                const isSelected = selectedNutritional.includes(cls)
                const colors = {
                  veg: isSelected ? 'bg-green-50 text-green-700 border-green-200' : 'hover:bg-green-50 hover:text-green-700 text-green-600 border-green-200',
                  carbs: isSelected ? 'bg-amber-50 text-amber-700 border-amber-200' : 'hover:bg-amber-50 hover:text-amber-700 text-amber-600 border-amber-200',
                  protein: isSelected ? 'bg-red-50 text-red-700 border-red-200' : 'hover:bg-red-50 hover:text-red-700 text-red-600 border-red-200'
                }
                const colorClass = colors[cls as keyof typeof colors] || 'bg-white text-muted-foreground border-input'
                
                return (
                  <button
                    key={cls}
                    onClick={() => onNutritionalClick?.(cls)}
                    className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors ${colorClass}`}
                  >
                    {cls}
                  </button>
                )
              })}
              {recipe.seasons?.map(season => {
                const isSelected = selectedSeasons.includes(season)
                return (
                  <button
                    key={season}
                    onClick={() => onSeasonClick?.(season)}
                    className={`cursor-pointer text-[10px] uppercase tracking-wider px-1.5 py-0 h-4 rounded-md border transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'hover:bg-blue-50 hover:text-blue-700 text-blue-600 border-blue-200'
                    }`}
                  >
                    {season}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-1">
            <RecipeFormModal recipe={recipe as any} />
            <form action={deleteRecipeAction.bind(null, recipe.id)}>
              <Button variant="ghost" size="icon" type="submit">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="space-y-3">
          {hasNoClasses && (
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded text-xs border border-amber-100">
              <Info className="h-3 w-3" />
              Classi non impostate
            </div>
          )}

          <div className="text-sm text-muted-foreground line-clamp-2">
            {recipe.ingredients.map(i => i.name).join(', ')}
          </div>
          
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.map(tag => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
