/**
 * localStorage-based caching utility for static/reference data
 * Use this for data that rarely changes (roles, clearance activities, etc.)
 */

const CACHE_PREFIX = 'epa_cache_'
const CACHE_VERSION = '1.0'

/**
 * Get cached data
 * @param {string} key - Cache key
 * @param {number} maxAge - Maximum age in milliseconds (default: 1 hour)
 * @returns {any|null} - Cached data or null if expired/not found
 */
export const getCachedData = (key, maxAge = 60 * 60 * 1000) => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!cached) return null

    const { data, timestamp, version } = JSON.parse(cached)

    // Check version
    if (version !== CACHE_VERSION) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    // Check age
    const age = Date.now() - timestamp
    if (age > maxAge) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return data
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export const setCachedData = (key, data) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    }
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem))
  } catch (error) {
    console.error('Error writing cache:', error)
    // If quota exceeded, clear old cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldCache()
    }
  }
}

/**
 * Clear cached data
 * @param {string} key - Cache key (optional, clears all if not provided)
 */
export const clearCachedData = (key = null) => {
  if (key) {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`)
  } else {
    // Clear all cache entries
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k))
  }
}

/**
 * Clear old cache entries (older than 24 hours)
 */
const clearOldCache = () => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  Object.keys(localStorage)
    .filter(k => k.startsWith(CACHE_PREFIX))
    .forEach(k => {
      try {
        const cached = localStorage.getItem(k)
        if (cached) {
          const { timestamp } = JSON.parse(cached)
          if (timestamp < oneDayAgo) {
            localStorage.removeItem(k)
          }
        }
      } catch {
        localStorage.removeItem(k)
      }
    })
}

/**
 * Cache keys for different data types
 */
export const cacheKeys = {
  roles: 'roles',
  clearanceActivities: 'clearance_activities',
  depots: 'depots',
  clients: 'clients',
}

