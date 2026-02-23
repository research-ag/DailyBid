/**
 * Determines the device type based on the user agent.
 * @returns 'mobile', 'tablet', or 'desktop' depending on the device
 */
export const getDeviceType = (): string => {
  const ua = navigator.userAgent
  if (/Mobi|Android/i.test(ua)) return 'mobile'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}

/**
 * Opens a popup window and executes the provided function within it.
 * Handles popup blocking and cleanup after execution.
 *
 * @template T The return type of the provided function
 * @param fn - The function to execute in the popup context
 * @param [options] - Optional configuration
 * @param [options.timeoutMs=5000] - Time in milliseconds before window.open is restored
 * @returns The result of the provided function
 * @throws  When popup is blocked
 */
export const customPopup = async <T>(
  fn: () => Promise<T>,
  options?: { timeoutMs?: number },
): Promise<T> => {
  const newTab = window.open('about:blank', '_blank')

  if (!newTab) {
    alert('Popup blocked! Please allow pop-ups and try again.')
    return Promise.reject(new Error('Popup blocked'))
  }

  const originalWindowOpen = window.open
  window.open = function (url, target) {
    if (newTab && !newTab.closed) {
      if (url) {
        newTab.location.href = url.toString()
      }
      return newTab
    }
    return originalWindowOpen(url, target)
  }

  const timeout = options?.timeoutMs ?? 5000

  try {
    try {
      return await fn()
    } finally {
      setTimeout(() => {
        window.open = originalWindowOpen
      }, timeout)
    }
  } catch (err) {
    newTab.close()
    throw err
  }
}
