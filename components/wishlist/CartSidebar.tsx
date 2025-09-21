'use client'

import { useCart } from '@/lib/contexts/CartContext'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

export function CartSidebar() {
  const { cartItems, removeFromCart, isCartOpen, closeCart, clearCart } = useCart()

  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.quantity,
    0
  )

  return (
    <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Gifting Cart</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4 p-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                    {item.image_url ? (
                       <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ): (
                       <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium line-clamp-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.price || 0}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            </div>
          </div>
        )}
        <Separator />
        <SheetFooter className="p-6 bg-background">
            {cartItems.length > 0 && (
                <>
                <div className="flex w-full justify-between text-lg font-semibold">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                    <SheetClose asChild>
                        <Button asChild className="w-full">
                            <Link href="/checkout">Proceed to Checkout</Link>
                        </Button>
                    </SheetClose>
                    <Button variant="outline" onClick={clearCart}>
                      Clear Cart
                    </Button>
                </div>
                </>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
} 