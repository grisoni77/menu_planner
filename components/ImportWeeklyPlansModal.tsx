'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importWeeklyPlansAction } from '@/app/actions/menu-actions'
import { CheckCircle, AlertCircle, FileUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ImportWeeklyPlansModal() {
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setIsUploading(true)
    setStatus(null)

    const formData = new FormData(form)
    const result = await importWeeklyPlansAction(formData)

    setIsUploading(false)
    if (result.success) {
      setStatus({ success: true, message: `Importati ${result.count} piani con successo!` })
      form.reset()
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
          Importa Storico (JSON)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importa Storico Menu</DialogTitle>
          <DialogDescription>
            Carica un file JSON contenente lo storico dei piani settimanali esportato precedentemente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input 
                type="file" 
                name="file" 
                accept=".json" 
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
