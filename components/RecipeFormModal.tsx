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
import { Plus, Edit2, AlertCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NutritionalClass, MealRole, RecipeSource } from '@/types/weekly-plan'

interface RecipeFormModalProps {
  recipe?: {
    id: string
    name: string
    ingredients: { name: string }[]
    tags: string[] | null
    nutritional_classes?: NutritionalClass[]
    meal_role?: MealRole
    source?: RecipeSource
  }
}

const NUTRITIONAL_CLASSES: { value: NutritionalClass; label: string }[] = [
  { value: 'veg', label: 'Verdura (Veg)' },
  { value: 'carbs', label: 'Carboidrati' },
  { value: 'protein', label: 'Proteine' },
]

export function RecipeFormModal({ recipe }: RecipeFormModalProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<NutritionalClass[]>(recipe?.nutritional_classes || [])
  const isEditing = !!recipe

  const toggleClass = (cls: NutritionalClass) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    
    // Aggiungi le classi selezionate al formData perché le checkbox personalizzate potrebbero non essere incluse automaticamente se non gestite con hidden inputs o name
    selectedClasses.forEach(cls => {
      formData.append('nutritional_classes', cls)
    })

    let result;
    if (isEditing && recipe) {
      result = await updateRecipeAction(recipe.id, formData)
    } else {
      result = await addRecipeAction(formData)
    }
    
    if (result && !result.success) {
      setError(result.error || "Si è verificato un errore")
    } else {
      setOpen(false)
      if (!isEditing) setSelectedClasses([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { 
      setOpen(v); 
      if(!v) setError(null);
      if(v && recipe) setSelectedClasses(recipe.nutritional_classes || [])
    }}>
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Ricetta' : 'Aggiungi Nuova Ricetta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
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
              <label htmlFor="meal_role" className="text-sm font-medium">Ruolo nel pasto</label>
              <Select name="meal_role" defaultValue={recipe?.meal_role || 'main'}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Piatto Principale (Main)</SelectItem>
                  <SelectItem value="side">Contorno (Side)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Classi Nutrizionali</label>
              <div className="flex flex-col gap-2 border rounded-md p-3">
                {NUTRITIONAL_CLASSES.map((cls) => (
                  <div key={cls.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`class-${cls.value}`} 
                      checked={selectedClasses.includes(cls.value)}
                      onCheckedChange={() => toggleClass(cls.value)}
                    />
                    <label 
                      htmlFor={`class-${cls.value}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cls.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
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
