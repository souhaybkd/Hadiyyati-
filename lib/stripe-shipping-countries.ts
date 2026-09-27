import type Stripe from 'stripe'

/**
 * Arab League / Arabic-speaking countries (ISO 3166-1 alpha-2).
 * Stripe Checkout will not show a country unless it is in allowed_countries.
 */
export const ARAB_SHIPPING_COUNTRIES = [
  'AE', // United Arab Emirates
  'BH', // Bahrain
  'DZ', // Algeria
  'EG', // Egypt
  'IQ', // Iraq
  'JO', // Jordan
  'KM', // Comoros
  'KW', // Kuwait
  'LB', // Lebanon
  'LY', // Libya
  'MA', // Morocco
  'MR', // Mauritania
  'OM', // Oman
  'PS', // Palestine
  'QA', // Qatar
  'SA', // Saudi Arabia
  'SD', // Sudan
  'SO', // Somalia
  'TN', // Tunisia
  'YE', // Yemen
] as const

/**
 * Countries Stripe typically rejects for Checkout shipping (sanctions / unsupported).
 * Do not add these or session creation can fail.
 */
const STRIPE_UNSUPPORTED_SHIPPING = new Set(['CU', 'IR', 'KP', 'SY'])

/**
 * Broad ISO list for Checkout shipping. Stripe still filters anything it does not
 * support; this is every common destination plus the Arabic countries above.
 */
const WORLD_SHIPPING_COUNTRIES = [
  ...ARAB_SHIPPING_COUNTRIES,
  'AD', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AW', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO',
  'BQ', 'BR', 'BS', 'BT', 'BW', 'BZ',
  'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR',
  'CV', 'CW', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO',
  'EC', 'EE', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP',
  'GQ', 'GR', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IS', 'IT',
  'JE', 'JM', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KN', 'KR', 'KY', 'KZ',
  'LA', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV',
  'MC', 'MD', 'ME', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MS', 'MT',
  'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PR', 'PT', 'PY',
  'RE', 'RO', 'RS', 'RW',
  'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SK', 'SL', 'SM', 'SN', 'SR', 'ST',
  'SV', 'SX', 'SZ',
  'TC', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VN', 'VU',
  'WS',
  'XK',
  'ZA', 'ZM', 'ZW',
] as const

const uniqueCodes = WORLD_SHIPPING_COUNTRIES.filter((code, index, list) => {
  return list.indexOf(code) === index && !STRIPE_UNSUPPORTED_SHIPPING.has(code)
})

export const STRIPE_SHIPPING_ALLOWED_COUNTRIES =
  uniqueCodes as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection['allowed_countries']
