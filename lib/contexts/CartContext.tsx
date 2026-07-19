'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type WishlistItem } from '@/lib/actions/wishlist'

interface CartItem extends WishlistItem {
  quantity: number
  wishlist_owner_name?: string;
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (item: WishlistItem & { wishlist_owner_name?: string }) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  /** False until cart has been restored from localStorage (avoids empty-cart flash on refresh). */
  isHydrated: boolean
}

const CART_STORAGE_KEY = 'hadiyyati_cart'

const CartContext = createContext<CartContextType | undefined>(undefined)

function readStoredCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Restore cart after mount so a page refresh keeps checkout items.
  useEffect(() => {
    setCartItems(readStoredCart())
    setIsHydrated(true)
  }, [])

  // Persist whenever the cart changes (after hydration only).
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch {
      // Ignore quota / private-mode write failures.
    }
  }, [cartItems, isHydrated])

  const addToCart = (item: WishlistItem & { wishlist_owner_name?: string }) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        // Not increasing quantity for now, just adding to cart.
        return prevItems; // Item already in cart
      }
      return [...prevItems, { ...item, quantity: 1 }]
    })
    openCart();
  }

  const removeFromCart = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isCartOpen, openCart, closeCart, isHydrated }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
