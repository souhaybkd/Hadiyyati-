import type {
  BankTransferDetails,
  BankTransferType,
  InternationalBankTransferDetails,
  LocalBankTransferDetails,
} from '@/lib/types/database'

export type PayoutFormFieldKind = 'text' | 'country' | 'currency'

export type PayoutFormField = {
  name: string
  label: string
  placeholder?: string
  kind?: PayoutFormFieldKind
}

export const BANK_INTERNATIONAL_FIELDS: PayoutFormField[] = [
  { name: 'iban', label: 'IBAN', placeholder: 'SA03 8000 0000 6080 1016 7519' },
  { name: 'accountName', label: 'Account holder name', placeholder: 'John Doe' },
  { name: 'currency', label: 'Currency', kind: 'currency' },
  { name: 'address', label: 'Address', placeholder: 'Street and number' },
  { name: 'city', label: 'City', placeholder: 'City' },
  { name: 'postalCode', label: 'Postal code / ZIP', placeholder: '10001' },
  { name: 'country', label: 'Country', kind: 'country' },
]

export const BANK_LOCAL_BANK_FIELDS: PayoutFormField[] = [
  { name: 'currency', label: 'Currency', kind: 'currency' },
  { name: 'accountNumber', label: 'Account number', placeholder: '1234567890' },
  { name: 'accountName', label: 'Account holder name', placeholder: 'John Doe' },
  { name: 'bankName', label: 'Bank name', placeholder: 'Bank name' },
  { name: 'bankCountry', label: 'Country', kind: 'country' },
  { name: 'bankAddress', label: 'Bank address', placeholder: 'Street and number' },
  { name: 'bankCity', label: 'Bank city', placeholder: 'City' },
  { name: 'bankPostalCode', label: 'Bank postal code / ZIP', placeholder: '10001' },
  { name: 'swiftBic', label: 'SWIFT / BIC', placeholder: 'ABCDEF12' },
]

export const BANK_LOCAL_PERSONAL_FIELDS: PayoutFormField[] = [
  { name: 'personalAddress', label: 'Address', placeholder: 'Street and number' },
  { name: 'personalCity', label: 'City', placeholder: 'City' },
  { name: 'personalPostalCode', label: 'Postal code / ZIP', placeholder: '10001' },
  { name: 'personalCountry', label: 'Country', kind: 'country' },
]

function trimField(formData: FormData, key: string): string {
  const raw = formData.get(key)
  return typeof raw === 'string' ? raw.trim() : ''
}

function requireFields(formData: FormData, keys: string[], context: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of keys) {
    const value = trimField(formData, key)
    if (!value) {
      throw new Error(`All fields are required for ${context}`)
    }
    out[key] = value
  }
  return out
}

export function inferBankTransferType(
  details: Record<string, unknown> | null | undefined
): BankTransferType {
  if (!details || typeof details !== 'object') return 'international'
  const type = details.bankTransferType
  if (type === 'local' || type === 'international') return type
  if (details.accountNumber || details.bankName || details.swiftBic) return 'local'
  return 'international'
}

export function parseBankTransferDetails(formData: FormData): BankTransferDetails {
  const bankTransferType = trimField(formData, 'bankTransferType') as BankTransferType

  if (bankTransferType === 'local') {
    const fields = requireFields(
      formData,
      [
        'currency',
        'accountNumber',
        'accountName',
        'bankName',
        'bankCountry',
        'bankAddress',
        'bankCity',
        'bankPostalCode',
        'swiftBic',
        'personalAddress',
        'personalCity',
        'personalPostalCode',
        'personalCountry',
      ],
      'local bank transfer'
    )
    return {
      bankTransferType: 'local',
      ...fields,
    } as LocalBankTransferDetails
  }

  if (bankTransferType !== 'international') {
    throw new Error('Select international or local bank transfer')
  }

  const fields = requireFields(
    formData,
    ['iban', 'accountName', 'currency', 'address', 'city', 'postalCode', 'country'],
    'international bank transfer'
  )

  return {
    bankTransferType: 'international',
    ...fields,
  } as InternationalBankTransferDetails
}

export function bankTransferTypeLabel(type: BankTransferType | undefined): string {
  if (type === 'local') return 'Local bank transfer'
  return 'International bank transfer'
}
