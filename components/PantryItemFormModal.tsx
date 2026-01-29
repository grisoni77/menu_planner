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
import { addPantryItemAction, updatePantryItemAction } from '@/app/actions/menu-actions'
import { Plus, Edit2, AlertCircle } from 'lucide-react'

interface PantryItemFormModalProps {
  item?: {
    id: string
    name: string
    quantity: string | null
    category: string | null
  }
}

export function PantryItemFormModal({ item }: PantryItemFormModalProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!item

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    
    let result;
    if (isEditing && item) {
      result = await updatePantryItemAction(item.id, formData)
    } else {
      result = await addPantryItemAction(formData)
    }
    
    if (result && !result.success) {
      setError(result.error || "Si è verificato un errore")
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setError(null); }}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Edit2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Aggiungi Ingrediente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Ingrediente' : 'Aggiungi Nuovo Ingrediente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Nome ingrediente</label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={item?.name} 
              placeholder="es. Farina 00" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">Quantità</label>
            <Input 
              id="quantity" 
              name="quantity" 
              defaultValue={item?.quantity || ''} 
              placeholder="es. 1kg o 2 pacchi" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Categoria</label>
            <Input 
              id="category" 
              name="category" 
              defaultValue={item?.category || ''} 
              placeholder="es. Secco, Frigo, Surgelati" 
            />
          </div>
          <Button type="submit" className="w-full">
            {isEditing ? 'Salva Modifiche' : 'Salva Ingrediente'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
