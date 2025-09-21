'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from 'lucide-react'

export function TransactionManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-design-text-heading">Transaction Management</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Platform Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-design-text-muted">
            Transaction management coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 