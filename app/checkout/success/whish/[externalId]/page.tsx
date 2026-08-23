'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CheckoutSuccessContent } from '@/components/checkout/CheckoutSuccessContent'

function WhishSuccessContent() {
  const params = useParams()
  const externalId = String(params?.externalId || '')

  return <CheckoutSuccessContent gateway="whish" externalId={externalId} />
}

export default function WhishCheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      }
    >
      <WhishSuccessContent />
    </Suspense>
  )
}
