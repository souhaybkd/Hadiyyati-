import type { SupabaseClient } from '@supabase/supabase-js'

export type CheckoutCartItem = {
  id: string
  title: string
  price: number
  quantity: number
  image_url?: string | null
  description?: string | null
  user_id?: string
  wishlist_owner_name?: string
}

/**
 * Resolve checkout line items from the database so list prices are authoritative
 * (buyer pays list price + platform fee at checkout).
 */
export async function resolveCheckoutItemsFromDb(
  supabase: SupabaseClient,
  clientItems: Array<{ id?: string; quantity?: number; wishlist_owner_name?: string }>
): Promise<CheckoutCartItem[]> {
  const ids = clientItems.map((i) => i.id).filter(Boolean) as string[]
  if (ids.length === 0) {
    throw new Error('No valid wishlist items in cart')
  }

  const { data: rows, error } = await supabase
    .from('wishlist_items')
    .select('id, title, price, image_url, description, user_id, is_purchased')
    .in('id', ids)

  if (error) throw new Error('Failed to validate cart items')

  const byId = new Map((rows || []).map((r) => [r.id, r]))

  return clientItems.map((clientItem, index) => {
    if (!clientItem.id) {
      throw new Error(`Invalid item at index ${index}`)
    }
    const row = byId.get(clientItem.id)
    if (!row) {
      throw new Error('One or more wishlist items were not found')
    }
    if (row.is_purchased) {
      throw new Error(`"${row.title}" is already marked as purchased`)
    }
    const price = Number(row.price)
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`Invalid price for "${row.title}"`)
    }
    return {
      id: row.id,
      title: row.title,
      price,
      quantity: clientItem.quantity || 1,
      image_url: row.image_url,
      description: row.description,
      user_id: row.user_id,
      wishlist_owner_name: clientItem.wishlist_owner_name,
    }
  })
}

export function itemsSubtotal(items: CheckoutCartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

/** Compact `id:qty` pairs for Stripe session metadata (Stripe metadata value length limits). */
export function encodeCheckoutItemLines(items: CheckoutCartItem[]): string {
  return items.map((item) => `${item.id}:${item.quantity}`).join(',')
}

export function parseCheckoutItemLines(encoded: string): Array<{ id: string; quantity: number }> {
  if (!encoded.trim()) return []
  return encoded.split(',').filter(Boolean).map((part) => {
    const [id, qtyStr] = part.split(':')
    const parsed = parseInt(qtyStr || '1', 10)
    const quantity = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    return { id, quantity }
  })
}

/** Unique wishlist item ids from encoded lines or legacy comma-separated id list. */
export function uniqueWishlistIdsFromMetadata(
  itemLines: string | undefined,
  itemIds: string | undefined
): string[] {
  if (itemLines?.trim()) {
    const seen = new Set<string>()
    return parseCheckoutItemLines(itemLines)
      .map((line) => line.id)
      .filter((id) => {
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
  }
  return (itemIds || '').split(',').filter(Boolean)
}
