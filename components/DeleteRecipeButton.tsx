'use client'

import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteRecipeAction } from "@/app/actions/menu-actions"

interface Props {
  recipeId: string
  recipeName: string
  /** Extra classes forwarded to the trigger Button */
  className?: string
}

export function DeleteRecipeButton({ recipeId, recipeName, className }: Props) {
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(() => deleteRecipeAction(recipeId))
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Elimina ricetta</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler eliminare{" "}
            <span className="font-medium text-foreground">"{recipeName}"</span>?
            L'operazione non è reversibile.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annulla</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={handleConfirm}>
            {pending ? "Eliminando…" : "Elimina"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}