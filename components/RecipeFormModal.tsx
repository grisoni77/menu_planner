'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addRecipeAction, updateRecipeAction } from '@/app/actions/menu-actions'
import { Plus, Edit2 } from 'lucide-react'

interface RecipeFormModalProps {
  recipe?: {
    id: string
    name: string
    ingredients: { name: string }[]
    tags: string[] | null
  }
}

export function RecipeFormModal({ recipe }: RecipeFormModalProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!recipe

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    
    if (isEditing && recipe) {
      await updateRecipeAction(recipe.id, formData)
    } else {
      await addRecipeAction(formData)
    }
    
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi Ricetta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Ricetta' : 'Aggiungi Nuova Ricetta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nome ricetta</label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={recipe?.name} 
              placeholder="es. Pasta alla Carbonara" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="ingredients" className="text-sm font-medium">Ingredienti (separati da virgola)</label>
            <Input 
              id="ingredients" 
              name="ingredients" 
              defaultValue={recipe?.ingredients.map(i => i.name).join(', ')} 
              placeholder="es. Pasta, Uova, Guanciale" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium">Tag (separati da virgola)</label>
            <Input 
              id="tags" 
              name="tags" 
              defaultValue={recipe?.tags?.join(', ')} 
              placeholder="es. Primo, Veloce" 
            />
          </div>
          <Button type="submit" className="w-full">
            {isEditing ? 'Salva Modifiche' : 'Salva Ricetta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
