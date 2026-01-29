'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Tag } from "lucide-react"
import { RecipeFormModal } from "./RecipeFormModal"
import { deleteRecipeAction } from "@/app/actions/menu-actions"

interface RecipeCardProps {
  recipe: {
    id: string
    name: string
    ingredients: { name: string }[]
    tags: string[] | null
  }
  onTagClick?: (tag: string) => void
  selectedTags?: string[]
}

export function RecipeCard({ recipe, onTagClick, selectedTags = [] }: RecipeCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg leading-tight">{recipe.name}</h3>
          <div className="flex gap-1">
            <RecipeFormModal recipe={recipe} />
            <form action={deleteRecipeAction.bind(null, recipe.id)}>
              <Button variant="ghost" size="icon" type="submit">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </form>
          </div>
        </div>
        
        <div className="space-y-3">
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
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
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
