/**
 * PIN Security Module
 * SHA-256 via Web Crypto API with localStorage session management.
 * Fallback provided for environments without crypto.subtle.
 */

const SESSION_KEY = 'microcatalog_pin_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/* -------------------------------------------------------------------------- */
/* Hashing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Hash a 4-digit PIN using SHA-256.
 * @param {string} pin - Raw PIN string
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashPin(pin) {
  if (!window.crypto?.subtle) {
    // Fallback: FNV-1a-like hash for environments without Web Crypto
    let hash = 0x811c9dc5
    for (let i = 0; i < pin.length; i++) {
      hash ^= pin.charCodeAt(i)
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
    }
    return `fb_${(hash >>> 0).toString(16).padStart(8, '0')}`
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a PIN against a stored hash.
 * @param {string} pin - Raw PIN string
 * @param {string} storedHash - Previously stored hash
 * @returns {Promise<boolean>}
 */
export async function verifyPin(pin, storedHash) {
  const computed = await hashPin(pin)
  return computed === storedHash
}

/* -------------------------------------------------------------------------- */
/* Session Management                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Store a validated PIN session in localStorage.
 * @param {string} sellerUuid
 * @param {string} manageToken
 */
export function setPinSession(sellerUuid, manageToken) {
  const session = {
    sellerUuid,
    manageToken,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // localStorage unavailable
  }
}

/**
 * Retrieve valid PIN session if present and not expired.
 * @returns {{sellerUuid: string, manageToken: string, expiresAt: number} | null}
 */
export function getPinSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      clearPinSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

/**
 * Remove PIN session from localStorage.
 */
export function clearPinSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

/**
 * Check if seller has a valid, unexpired PIN session.
 * @param {string} expectedSellerUuid
 * @returns {boolean}
 */
export function hasValidPinSession(expectedSellerUuid) {
  const session = getPinSession()
  if (!session) return false
  return session.sellerUuid === expectedSellerUuid
}

/**
 * Check if PIN is set for this seller.
 * @param {Object} seller - Seller row from Supabase
 * @returns {boolean}
 */
export function isPinSet(seller) {
  return Boolean(seller?.pin_hash)
}
