import { useEffect } from 'react'

const MixpanelBlockInterceptorComponent: React.FC = () => {
  function mixpanelBlockInterceptor() {
    if (typeof window === 'undefined' || typeof XMLHttpRequest === 'undefined')
      return

    const originalOpen = XMLHttpRequest.prototype.open

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null,
    ) {
      const urlStr = typeof url === 'string' ? url : url.toString()

      if (urlStr.includes('api-js.mixpanel.com')) {
        this.addEventListener('error', () => {
          console.warn('[Mixpanel] BLOCKED via XHR error')
        })

        this.addEventListener('load', () => {
          if (this.status === 0) {
            console.warn('[Mixpanel] BLOCKED (status 0)')
          }
        })
      }

      return originalOpen.call(this, method, url, async, username, password)
    }
  }

  useEffect(() => {
    mixpanelBlockInterceptor()
  }, [])

  return null
}
export default MixpanelBlockInterceptorComponent
