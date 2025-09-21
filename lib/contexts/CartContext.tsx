'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (item: WishlistItem & { wishlist_owner_name?: string }) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        // Not increasing quantity for now, just adding to cart.
        // Could be changed to:
        // return prevItems.map(cartItem =>
        //   cartItem.id === item.id
        //     ? { ...cartItem, quantity: cartItem.quantity + 1 }
        //     : cartItem
        // );
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
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, isCartOpen, openCart, closeCart }}>
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