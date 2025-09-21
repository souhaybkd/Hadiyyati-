import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Wishlist Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Sorry, we couldn't find the wishlist you're looking for. It may have been moved, deleted, or the username might be incorrect.
          </p>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth">
                Create Your Own Wishlist
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 