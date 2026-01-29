'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Package } from "lucide-react"
import { PantryItemFormModal } from "./PantryItemFormModal"
import { deletePantryItemAction } from "@/app/actions/menu-actions"

interface PantryItemCardProps {
  item: {
    id: string
    name: string
    quantity: string | null
    category: string | null
  }
}

export function PantryItemCard({ item }: PantryItemCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium leading-tight">{item.name}</h3>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                {item.quantity && <span>{item.quantity}</span>}
                {item.quantity && item.category && <span>•</span>}
                {item.category && <span>{item.category}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <PantryItemFormModal item={item} />
            <form action={deletePantryItemAction.bind(null, item.id)}>
              <Button variant="ghost" size="icon" type="submit">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
