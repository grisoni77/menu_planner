/**
 * Shared color tokens for nutritional classes (veg/carbs/protein)
 * and meal roles (main/side).
 *
 * Variants:
 *   button        — filter-bar toggle, active state
 *   buttonInactive — filter-bar toggle, inactive state
 *   badge         — static badge (active-filter chips, selected table row)
 *   badgeInactive — interactive badge, not-selected table row
 */

export const NUTRITIONAL_CLASS_COLORS = {
  veg: {
    button:        'bg-green-600 hover:bg-green-700',
    buttonInactive: 'hover:bg-green-50 hover:text-green-700 text-green-600',
    badge:         'bg-green-50 text-green-700 border-green-200',
    badgeInactive: 'hover:bg-green-50 hover:text-green-700 text-green-600 border-green-200',
  },
  carbs: {
    button:        'bg-amber-600 hover:bg-amber-700',
    buttonInactive: 'hover:bg-amber-50 hover:text-amber-700 text-amber-600',
    badge:         'bg-amber-50 text-amber-700 border-amber-200',
    badgeInactive: 'hover:bg-amber-50 hover:text-amber-700 text-amber-600 border-amber-200',
  },
  protein: {
    button:        'bg-red-600 hover:bg-red-700',
    buttonInactive: 'hover:bg-red-50 hover:text-red-700 text-red-600',
    badge:         'bg-red-50 text-red-700 border-red-200',
    badgeInactive: 'hover:bg-red-50 hover:text-red-700 text-red-600 border-red-200',
  },
} as const

export const MEAL_ROLE_COLORS = {
  main: {
    button:        'bg-indigo-600 hover:bg-indigo-700',
    buttonInactive: 'hover:bg-indigo-50 hover:text-indigo-700',
    badge:         'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeInactive: 'hover:bg-indigo-50 hover:text-indigo-700 border-transparent bg-secondary text-secondary-foreground',
  },
  side: {
    button:        'bg-slate-700 hover:bg-slate-800',
    buttonInactive: 'hover:bg-slate-100 text-slate-600',
    badge:         'bg-slate-100 text-slate-700 border-slate-200',
    badgeInactive: 'hover:bg-slate-100 hover:text-slate-700 border-transparent bg-secondary text-secondary-foreground',
  },
} as const

type NutritionalClass = keyof typeof NUTRITIONAL_CLASS_COLORS
type NutritionalVariant = keyof typeof NUTRITIONAL_CLASS_COLORS.veg
type MealRole = keyof typeof MEAL_ROLE_COLORS
type MealRoleVariant = keyof typeof MEAL_ROLE_COLORS.main

const FALLBACK = 'bg-slate-100 text-slate-700 border-slate-200'

export function getNutritionalClassColor(cls: string, variant: NutritionalVariant): string {
  return NUTRITIONAL_CLASS_COLORS[cls as NutritionalClass]?.[variant] ?? FALLBACK
}

export function getMealRoleColor(role: string, variant: MealRoleVariant): string {
  return MEAL_ROLE_COLORS[role as MealRole]?.[variant] ?? FALLBACK
}
