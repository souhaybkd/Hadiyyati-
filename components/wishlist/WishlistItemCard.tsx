'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  Gift, 
  Image as ImageIcon
} from 'lucide-react'
import { toggleItemPurchased, type WishlistItem, type Profile } from '@/lib/actions/wishlist'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/contexts/CartContext'

interface WishlistItemCardProps {
  item: WishlistItem
  profile: Profile
  palette?: {
    link: string;
    buttonPrimary?: string;
    buttonOutline?: string;
  }
}

export function WishlistItemCard({ item, profile, palette }: WishlistItemCardProps) {
  const { addToCart } = useCart()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = () => {
    setIsAddingToCart(true)
    addToCart({ ...item, wishlist_owner_name: profile.full_name })
    // We can add a small delay or feedback before setting to false
    // for now, it's quick.
    setIsAddingToCart(false)
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-0">
        {/* Image */}
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-gray-300" />
            </div>
          )}
          {item.is_purchased && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-500 text-white">
                <Gift className="h-3 w-3 mr-1" />
                Purchased
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {item.title}
          </h3>
          
          {item.price > 0 && (
            <p className={cn("text-2xl font-bold mb-3", palette?.link || 'text-purple-600')}>
              ${item.price}
            </p>
          )}
          
          {item.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {item.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-col">
            {item.product_url && (
              <Button asChild className={cn("flex-1", palette?.buttonPrimary || "bg-blue-600 hover:bg-blue-700 text-white")}>
                <a 
                  href={item.product_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Item
                </a>
              </Button>
            )}
            
            {!item.is_purchased && (
              <Button 
                variant="outline" 
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className={cn("flex-1", palette?.buttonOutline || "border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white")}
              >
                {isAddingToCart ? (
                  'Adding...'
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    I'll Gift This
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 