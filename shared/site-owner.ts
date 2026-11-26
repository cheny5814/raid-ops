// Public identity confirmed by the operator. Email is intentionally not provided yet.
export const SITE_OWNER: { displayName: string | null; operatorName: string | null; email: string | null } = {
  displayName: 'RAID OPS',
  operatorName: 'RAID OPS',
  email: null,
}
export function ownerInfoReady() {
  return !!(SITE_OWNER.displayName?.trim() && SITE_OWNER.operatorName?.trim())
}
export function contactInfoReady() {
  return !!(ownerInfoReady() && SITE_OWNER.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SITE_OWNER.email))
}
