import { STRIPE_SHIPPING_ALLOWED_COUNTRIES } from '@/lib/stripe-shipping-countries'

export type SelectOption = { value: string; label: string }

/** Common payout currencies (ISO 4217). */
const PAYOUT_CURRENCY_CODES = [
  'AED',
  'AUD',
  'BHD',
  'CAD',
  'CHF',
  'CNY',
  'DKK',
  'EGP',
  'EUR',
  'GBP',
  'HKD',
  'INR',
  'JOD',
  'JPY',
  'KWD',
  'LBP',
  'MAD',
  'MXN',
  'NOK',
  'NZD',
  'OMR',
  'PLN',
  'QAR',
  'SAR',
  'SEK',
  'SGD',
  'TND',
  'TRY',
  'USD',
  'ZAR',
] as const

let countryOptionsCache: SelectOption[] | null = null
let currencyOptionsCache: SelectOption[] | null = null

export function getPayoutCountryOptions(): SelectOption[] {
  if (countryOptionsCache) return countryOptionsCache
  const display = new Intl.DisplayNames(['en'], { type: 'region' })
  const codes = STRIPE_SHIPPING_ALLOWED_COUNTRIES as readonly string[]
  countryOptionsCache = codes
    .map((code) => ({
      value: code,
      label: display.of(code) || code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
  return countryOptionsCache
}

export function getPayoutCurrencyOptions(): SelectOption[] {
  if (currencyOptionsCache) return currencyOptionsCache
  const display = new Intl.DisplayNames(['en'], { type: 'currency' })
  currencyOptionsCache = PAYOUT_CURRENCY_CODES.map((code) => ({
    value: code,
    label: `${code} — ${display.of(code) || code}`,
  }))
  return currencyOptionsCache
}

export function optionsWithLegacyValue(
  options: SelectOption[],
  value: string | undefined
): SelectOption[] {
  if (!value || options.some((o) => o.value === value)) return options
  return [{ value, label: value }, ...options]
}

export function normalizeCountryValue(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase()
  const options = getPayoutCountryOptions()
  const byLabel = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase())
  return byLabel?.value ?? trimmed
}

export function normalizeCurrencyValue(raw: string): string {
  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return ''
  const options = getPayoutCurrencyOptions()
  if (options.some((o) => o.value === trimmed)) return trimmed
  const byLabel = options.find((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()))
  return byLabel?.value ?? trimmed
}

export function formatPayoutCountry(value: string | undefined): string {
  if (!value) return ''
  const options = getPayoutCountryOptions()
  const match = options.find((o) => o.value === value)
  if (match) return match.label
  if (/^[A-Za-z]{2}$/.test(value)) {
    const display = new Intl.DisplayNames(['en'], { type: 'region' })
    return display.of(value.toUpperCase()) || value
  }
  return value
}

export function formatPayoutCurrency(value: string | undefined): string {
  if (!value) return ''
  const options = getPayoutCurrencyOptions()
  const match = options.find((o) => o.value === value.toUpperCase())
  if (match) return match.label
  return value
}

export const PAYOUT_COUNTRY_FIELD_NAMES = new Set([
  'country',
  'bankCountry',
  'personalCountry',
])

export function isPayoutCurrencyField(name: string): boolean {
  return name === 'currency'
}

export function isPayoutCountryField(name: string): boolean {
  return PAYOUT_COUNTRY_FIELD_NAMES.has(name)
}
