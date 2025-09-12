import { useEffect } from 'react'

import mixpanel from 'mixpanel-browser'

const MIXPANEL_TOKEN = `${process.env.ENV_MIXPANEL_TOKEN}`

export const useMixpanel = () => {
  useEffect(() => {
    if (!import.meta.env.PROD) return

    mixpanel.init(MIXPANEL_TOKEN, {
      debug: false,
      persistence: 'localStorage',
    })
  }, [])
}
