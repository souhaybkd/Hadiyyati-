import type { PayoutDetails } from '@/lib/types/database'
import { bankTransferTypeLabel, inferBankTransferType } from '@/lib/payout-bank'
import { formatPayoutCountry, formatPayoutCurrency } from '@/lib/payout-select-options'

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
    case 'bank': {
      const bankType = inferBankTransferType(d)
      const typeLabel = bankTransferTypeLabel(bankType)
      if (bankType === 'local') {
        const line = [d.accountName, d.accountNumber, d.bankName].filter(Boolean).join(' · ')
        return line ? `${typeLabel}: ${line}` : typeLabel
      }
      if (d.iban) {
        const line = d.accountName ? `${d.accountName} · ${d.iban}` : d.iban
        return `${typeLabel}: ${line}`
      }
      return d.accountName ? `${typeLabel}: ${d.accountName}` : typeLabel
    }
    case 'western_union':
      return [d.fullName, d.country, d.phoneNumber].filter(Boolean).join(' · ') || null
    case 'taptap':
    case 'whish':
      return d.mobileMoneyNumber || null
    default:
      return null
  }
}

export type PayoutDetailRow = { label: string; value: string }

/** Labeled fields for admin user detail views. */
export function payoutDetailRows(
  method: string | null | undefined,
  details: PayoutDetails | Record<string, unknown> | null | undefined
): PayoutDetailRow[] {
  if (!method || !details || typeof details !== 'object') return []

  const d = details as Record<string, string>

  switch (method) {
    case 'bank': {
      const bankType = inferBankTransferType(d)
      const typeRow = { label: 'Transfer type', value: bankTransferTypeLabel(bankType) }
      if (bankType === 'local') {
        return [
          typeRow,
          { label: 'Currency', value: formatPayoutCurrency(d.currency) },
          { label: 'Account number', value: d.accountNumber },
          { label: 'Account holder name', value: d.accountName },
          { label: 'Bank name', value: d.bankName },
          { label: 'Bank country', value: formatPayoutCountry(d.bankCountry) },
          { label: 'Bank address', value: d.bankAddress },
          { label: 'Bank city', value: d.bankCity },
          { label: 'Bank postal code / ZIP', value: d.bankPostalCode },
          { label: 'SWIFT / BIC', value: d.swiftBic },
          { label: 'Personal address', value: d.personalAddress },
          { label: 'Personal city', value: d.personalCity },
          { label: 'Personal postal code / ZIP', value: d.personalPostalCode },
          { label: 'Personal country', value: formatPayoutCountry(d.personalCountry) },
        ].filter((row) => Boolean(row.value))
      }
      return [
        typeRow,
        { label: 'IBAN', value: d.iban },
        { label: 'Account holder name', value: d.accountName },
        { label: 'Currency', value: formatPayoutCurrency(d.currency) },
        { label: 'Address', value: d.address },
        { label: 'City', value: d.city },
        { label: 'Postal code / ZIP', value: d.postalCode },
        { label: 'Country', value: formatPayoutCountry(d.country) },
      ].filter((row) => Boolean(row.value))
    }
    case 'western_union':
      return [
        { label: 'Full name', value: d.fullName },
        { label: 'Country', value: formatPayoutCountry(d.country) },
        { label: 'Phone number', value: d.phoneNumber },
      ].filter((row) => Boolean(row.value))
    case 'taptap':
    case 'whish':
      return [{ label: 'Mobile money number', value: d.mobileMoneyNumber }].filter((row) =>
        Boolean(row.value)
      )
    default:
      return []
  }
}
