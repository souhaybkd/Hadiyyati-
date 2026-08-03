// Server-only Veriff Public API client for KYC session creation + HMAC helpers.
// Docs: https://devdocs.veriff.com/docs
import { createHmac, timingSafeEqual } from 'crypto'
import type { KycStatus, KycVerificationStatus } from '@/lib/types/database'

const DEFAULT_BASE_URL = 'https://stationapi.veriff.com'

export function getVeriffConfig() {
  const apiKey = process.env.VERIFF_API_KEY
  const sharedSecretKey = process.env.VERIFF_SHARED_SECRET_KEY
  const baseUrl = (process.env.VERIFF_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')

  if (!apiKey) {
    throw new Error('Missing env.VERIFF_API_KEY')
  }
  if (!sharedSecretKey) {
    throw new Error('Missing env.VERIFF_SHARED_SECRET_KEY')
  }

  return { apiKey, sharedSecretKey, baseUrl }
}

/** Hex HMAC-SHA256 of the raw payload string using the integration shared secret. */
export function signVeriffPayload(payload: string, sharedSecretKey: string): string {
  return createHmac('sha256', sharedSecretKey).update(payload, 'utf8').digest('hex')
}

/** Constant-time compare of webhook X-HMAC-SIGNATURE against expected digest. */
export function verifyVeriffSignature(
  rawBody: string,
  signatureHeader: string | null,
  sharedSecretKey: string
): boolean {
  if (!signatureHeader) return false

  const expected = signVeriffPayload(rawBody, sharedSecretKey)
  const expectedBuf = Buffer.from(expected, 'utf8')
  const receivedBuf = Buffer.from(signatureHeader.trim().toLowerCase(), 'utf8')

  if (expectedBuf.length !== receivedBuf.length) return false
  return timingSafeEqual(expectedBuf, receivedBuf)
}

export interface CreateVeriffSessionInput {
  callback: string
  vendorData: string
  firstName?: string
  lastName?: string
  email?: string
}

export interface VeriffSessionResponse {
  status: string
  verification: {
    id: string
    url: string
    vendorData: string
    host?: string
    status: string
    sessionToken: string
  }
}

export async function createVeriffSession(
  input: CreateVeriffSessionInput
): Promise<VeriffSessionResponse> {
  const { apiKey, sharedSecretKey, baseUrl } = getVeriffConfig()

  const person: Record<string, string> = {}
  if (input.firstName) person.firstName = input.firstName
  if (input.lastName) person.lastName = input.lastName
  if (input.email) person.email = input.email

  const body = {
    verification: {
      callback: input.callback,
      vendorData: input.vendorData,
      ...(Object.keys(person).length > 0 ? { person } : {}),
    },
  }

  const payload = JSON.stringify(body)
  // POST /v1/sessions does not require X-HMAC-SIGNATURE, but signing is harmless
  // and matches our other authenticated Veriff calls.
  const signature = signVeriffPayload(payload, sharedSecretKey)

  const res = await fetch(`${baseUrl}/v1/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AUTH-CLIENT': apiKey,
      'X-HMAC-SIGNATURE': signature,
    },
    body: payload,
    cache: 'no-store',
  })

  const data = (await res.json().catch(() => null)) as VeriffSessionResponse | null

  if (!res.ok || !data?.verification?.id || !data?.verification?.url) {
    console.error('Veriff create session failed:', res.status, data)
    throw new Error('Failed to create Veriff verification session')
  }

  return data
}

/** Map Veriff decision code / status string → app KYC + verification statuses. */
export function mapVeriffDecision(params: {
  status?: string | null
  code?: number | null
}): { kycStatus: KycStatus; verificationStatus: KycVerificationStatus } {
  const status = (params.status || '').toLowerCase()
  const code = params.code ?? null

  if (status === 'approved' || code === 9001) {
    return { kycStatus: 'approved', verificationStatus: 'approved' }
  }
  if (status === 'declined' || code === 9102) {
    return { kycStatus: 'declined', verificationStatus: 'declined' }
  }
  if (status === 'resubmission_requested' || code === 9103) {
    return { kycStatus: 'resubmission_requested', verificationStatus: 'resubmission_requested' }
  }
  if (status === 'expired' || code === 9104) {
    return { kycStatus: 'unverified', verificationStatus: 'expired' }
  }
  if (status === 'abandoned') {
    return { kycStatus: 'unverified', verificationStatus: 'abandoned' }
  }

  // In-progress / unknown: keep pending for profile, preserve session-ish status if known
  if (status === 'created' || status === 'started' || status === 'submitted') {
    return {
      kycStatus: 'pending',
      verificationStatus: status as KycVerificationStatus,
    }
  }

  return { kycStatus: 'pending', verificationStatus: 'submitted' }
}

export function splitFullName(fullName?: string | null): {
  firstName?: string
  lastName?: string
} {
  if (!fullName?.trim()) return {}
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}
