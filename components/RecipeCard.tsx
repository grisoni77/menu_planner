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
}

export function RecipeCard({ recipe }: RecipeCardProps) {
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
              {recipe.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
