/**
 * Fetches user's geolocation data from geolocation-db.com
 * @returns A string containing the country name and state (format: "Country Name - State")
 * If the request fails, returns "Unknown"
 */
export const getLocation = async (): Promise<string> => {
  try {
    const res = await fetch('https://geolocation-db.com/json/')
    const data = await res.json()
    return `${data.country_name} - ${data.state}`
  } catch {
    return 'Unknown'
  }
}

/**
 * Fetches user's geolocation data from ipwho.is
 * @returns  A string containing the country and region (format: "Country - Region")
 * If the request fails or returns unsuccessful data, returns "Unknown"
 */
export const getLocationWhoIs = async (): Promise<string> => {
  try {
    const res = await fetch('https://ipwho.is/')
    const data = await res.json()
    if (!data.success) throw new Error()
    return `${data.country} - ${data.region}`
  } catch {
    return 'Unknown'
  }
}
