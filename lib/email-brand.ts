/** Absolute URL for the platform logo in transactional emails. */
export function getEmailLogoUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://hadiyyati.com').replace(/\/$/, '')
  return `${base}/assets/img/LOGO.png`
}

export function getEmailSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://hadiyyati.com').replace(/\/$/, '')
}
