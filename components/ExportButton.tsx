'use client'

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
  data: any[]
  filename: string
  type: 'recipes' | 'pantry' | 'weekly-plan' | 'weekly-plans-history'
  label?: string
}

export function ExportButton({ data, filename, type, label }: ExportButtonProps) {
  const exportData = () => {
    if (type === 'weekly-plans-history') {
      const content = JSON.stringify(data, null, 2)
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename.endsWith('.json') ? filename : `${filename}.json`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    if (type === 'weekly-plan') {
      const plan = data[0] // Ci aspettiamo il singolo piano come primo elemento
      if (!plan) return

      let content = `# Piano Settimanale\n\n`
      
      plan.weekly_menu.forEach((day: any) => {
        content += `## ${day.day}\n`
        content += `### Pranzo\n`
        day.lunch.recipes.forEach((r: any) => {
          content += `- ${r.name} (${r.meal_role})\n`
        })
        content += `### Cena\n`
        day.dinner.recipes.forEach((r: any) => {
          content += `- ${r.name} (${r.meal_role})\n`
        })
        const pantryItems = [...new Set([
          ...(day.lunch.ingredients_used_from_pantry || []),
          ...(day.dinner.ingredients_used_from_pantry || [])
        ])];
        if (pantryItems.length > 0) {
          content += `\n*Dalla dispensa: ${pantryItems.join(', ')}*\n`
        }
        content += `\n`
      })

      content += `## Lista della Spesa\n`
      plan.shopping_list.forEach((item: any) => {
        content += `- [ ] ${item.item} (${item.quantity})\n`
      })

      if (plan.summary_note) {
        content += `\n---\n${plan.summary_note}\n`
      }

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename.endsWith('.md') ? filename : `${filename}.md`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    let csvContent = ""
    
    if (type === 'recipes') {
      // Header: nome,ingredienti,tag,ruolo,classi
      csvContent = "nome,ingredienti,tag,ruolo,classi\n"
      data.forEach(recipe => {
        const name = `"${recipe.name.replace(/"/g, '""')}"`
        const ingredientsArr = Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.map((i: any) => i.name) 
          : []
        const ingredients = `"${ingredientsArr.join(', ').replace(/"/g, '""')}"`
        const tags = `"${(recipe.tags || []).join(', ').replace(/"/g, '""')}"`
        const role = `"${recipe.meal_role || 'main'}"`
        const classes = `"${(recipe.nutritional_classes || []).join(', ')}"`
        
        csvContent += `${name},${ingredients},${tags},${role},${classes}\n`
      })
    } else {
      // Header: nome,quantità,categoria
      csvContent = "nome,quantità,categoria\n"
      data.forEach(item => {
        const name = `"${item.name.replace(/"/g, '""')}"`
        const quantity = `"${(item.quantity || '').replace(/"/g, '""')}"`
        const category = `"${(item.category || '').replace(/"/g, '""')}"`
        
        csvContent += `${name},${quantity},${category}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={exportData}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {label || (type === 'weekly-plan' ? "Esporta Piano" : "Esporta CSV")}
    </Button>
  )
}
