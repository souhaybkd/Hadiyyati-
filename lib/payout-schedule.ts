import { addDays } from 'date-fns'

/** Calendar days after order purchase when payout is scheduled (see terms / product policy). */
export const ORDER_PAYOUT_DELAY_DAYS = 10

export function getScheduledPayoutDate(purchaseDate: string | Date): Date {
  const base =
    typeof purchaseDate === 'string' ? new Date(purchaseDate) : new Date(purchaseDate.getTime())
  if (Number.isNaN(base.getTime())) {
    throw new Error('Invalid purchase date')
  }
  return addDays(base, ORDER_PAYOUT_DELAY_DAYS)
}

export function isScheduledPayoutReached(purchaseDate: string | Date, asOf: Date = new Date()): boolean {
  return asOf.getTime() >= getScheduledPayoutDate(purchaseDate).getTime()
}
