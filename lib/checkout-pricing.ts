/** Product name for the Stripe line item — excluded from gift order_items in the webhook. */
export const PLATFORM_FEE_STRIPE_PRODUCT_NAME = 'Hadiyyati platform fee'

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

export function computeCheckoutTotals(itemsSubtotal: number, feePercentage: number) {
  const subtotal = roundMoney(itemsSubtotal)
  const platformFee = roundMoney(subtotal * (feePercentage / 100))
  const buyerTotal = roundMoney(subtotal + platformFee)
  return {
    itemsSubtotal: subtotal,
    platformFee,
    buyerTotal,
    feePercentage,
  }
}
