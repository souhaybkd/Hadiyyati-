import type { PayoutDetails } from '@/lib/types/database'

export type PayoutMethodId = 'bank' | 'western_union' | 'taptap' | 'whish'

const METHOD_LABELS: Record<PayoutMethodId, string> = {
  bank: 'Bank Transfer',
  western_union: 'Western Union',
  taptap: 'TapTap Send',
  whish: 'Whish Money',
}

export function payoutMethodLabel(method: string | null | undefined): string {
  if (!method) return 'Not set'
  return METHOD_LABELS[method as PayoutMethodId] || method
}

/** Short line for admin tables (no secrets beyond what the user saved for payouts). */
export function payoutDetailsSummary(
  method: string | null | undefined,
  details: PayoutDetails | Record<string, unknown> | null | undefined
): string | null {
  if (!method || !details || typeof details !== 'object') return null

  const d = details as Record<string, string>

  switch (method) {
    case 'bank':
      if (d.iban) return d.accountName ? `${d.accountName} · ${d.iban}` : d.iban
      return d.accountName || null
    case 'western_union':
      return [d.fullName, d.country, d.phoneNumber].filter(Boolean).join(' · ') || null
    case 'taptap':
    case 'whish':
      return d.mobileMoneyNumber || null
    default:
      return null
  }
}
