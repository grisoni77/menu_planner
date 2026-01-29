'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importPantryItemsAction } from '@/app/actions/menu-actions'
import { CheckCircle, AlertCircle, FileUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ImportPantryModal() {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUploading(true)
    setStatus(null)

    const formData = new FormData(event.currentTarget)
    const result = await importPantryItemsAction(formData)

    setIsUploading(false)
    if (result.success) {
      setStatus({ success: true, message: `Importati ${result.count} ingredienti con successo!` })
      event.currentTarget.reset()
      setTimeout(() => {
        setOpen(false)
        setStatus(null)
      }, 2000)
    } else {
      setStatus({ success: false, message: result.error || "Errore durante l'importazione" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileUp className="h-4 w-4" />
          Importa CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importa Dispensa</DialogTitle>
          <DialogDescription>
            Carica un file CSV con i tuoi ingredienti. Il formato deve essere: <code>nome,quantità,categoria</code>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-xs text-muted-foreground">
            Esempio: <code>Farina 00,1kg,Secco</code>
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input 
                type="file" 
                name="file" 
                accept=".csv" 
                required 
                disabled={isUploading}
                className="cursor-pointer"
              />
            </div>
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? "Importazione..." : "Carica file"}
            </Button>
          </form>

          {status && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-md ${status.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {status.message}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
