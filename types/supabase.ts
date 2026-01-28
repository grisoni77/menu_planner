export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pantry_items: {
        Row: {
          id: string
          name: string
          quantity: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: string | null
          category?: string | null
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          name: string
          ingredients: Json
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ingredients: Json
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ingredients?: Json
          tags?: string[] | null
          created_at?: string
        }
      }
      weekly_plans: {
        Row: {
          id: string
          created_at: string
          menu_data: Json
          shopping_list: Json
        }
        Insert: {
          id?: string
          created_at?: string
          menu_data: Json
          shopping_list: Json
        }
        Update: {
          id?: string
          created_at?: string
          menu_data?: Json
          shopping_list?: Json
        }
      }
    }
  }
}
