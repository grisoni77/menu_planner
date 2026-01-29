'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importRecipesAction } from '@/app/actions/menu-actions'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

export function ImportRecipesForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUploading(true)
    setStatus(null)

    const formData = new FormData(event.currentTarget)
    const result = await importRecipesAction(formData)

    setIsUploading(false)
    if (result.success) {
      setStatus({ success: true, message: `Importate ${result.count} ricette con successo!` })
      event.currentTarget.reset()
    } else {
      setStatus({ success: false, message: result.error || "Errore durante l'importazione" })
    }
  }

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="text-sm font-medium">Importa da CSV</div>
      <p className="text-xs text-muted-foreground">
        Il file deve avere l'header: <code>nome,ingredienti,tag</code>. <br/>
        Usa le virgolette per ingredienti multipli: <code>Carbonara,"pasta, uova, guanciale",primo</code>
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input 
          type="file" 
          name="file" 
          accept=".csv" 
          required 
          disabled={isUploading}
          className="cursor-pointer"
        />
        <Button type="submit" variant="outline" disabled={isUploading} className="flex items-center gap-2">
          {isUploading ? "Importazione..." : (
            <>
              <Upload className="h-4 w-4" />
              Carica CSV
            </>
          )}
        </Button>
      </form>

      {status && (
        <div className={`flex items-center gap-2 text-sm p-2 rounded ${status.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {status.message}
        </div>
      )}
    </div>
  )
}
