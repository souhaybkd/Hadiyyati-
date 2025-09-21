import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client component client using modern @supabase/ssr
export const createSupabaseClient = () => createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Database types (to be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          email: string
          avatar_url: string | null
          background_image_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
          wishlist_color_palette: string | null
          wishlist_description: string | null
        }
        Insert: {
          id: string
          username: string
          full_name: string
          email: string
          avatar_url?: string | null
          background_image_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
          wishlist_color_palette?: string | null
          wishlist_description?: string | null
        }
        Update: {
          id?: string
          username?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          background_image_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
          wishlist_color_palette?: string | null
          wishlist_description?: string | null
        }
      }
      wishlist_items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          price: number
          image_url: string | null
          product_url: string | null
          is_public: boolean
          is_purchased: boolean
          purchased_by: string | null
          created_at: string
          updated_at: string
          sort_order: number | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          price: number
          image_url?: string | null
          product_url?: string | null
          is_public?: boolean
          is_purchased?: boolean
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
          sort_order?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          price?: number
          image_url?: string | null
          product_url?: string | null
          is_public?: boolean
          is_purchased?: boolean
          purchased_by?: string | null
          created_at?: string
          updated_at?: string
          sort_order?: number | null
        }
      }
      transactions: {
        Row: {
          id: string
          buyer_id: string
          seller_id: string
          wishlist_item_id: string
          amount: number
          stripe_payment_intent_id: string
          status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          seller_id: string
          wishlist_item_id: string
          amount: number
          stripe_payment_intent_id: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          buyer_id?: string
          seller_id?: string
          wishlist_item_id?: string
          amount?: number
          stripe_payment_intent_id?: string
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 