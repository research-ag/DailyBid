import mixpanel from 'mixpanel-browser'

const now = () => new Date().toISOString()

export const analytics = {
  // User Identification
  userIdentify: (principal: string) => {
    if (!import.meta.env.PROD) return
    mixpanel.identify(principal)
  },

  // User Authentication Events
  userLoggedIn: (data: { principal: string; login_method: string }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('User Logged In', {
      ...data,
      timestamp: now(),
    })
  },

  userLoggedOut: (principal: string) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('User Logged Out', {
      principal,
      timestamp: now(),
    })
  },

  // Auction Events
  bidPlaced: (data: {
    principal: string
    auction_id: string
    bid_amount: string
    price: string
    asset: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Bid Placed', {
      ...data,
      timestamp: now(),
    })
  },

  bidCanceled: (data: {
    principal: string
    auction_id: string
    bid_amount: string
    price: string
    asset: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Bid Canceled', {
      ...data,
      timestamp: now(),
    })
  },

  askPlaced: (data: {
    principal: string
    auction_id: string
    ask_amount: string
    price: string
    asset: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Ask Placed', {
      ...data,
      timestamp: now(),
    })
  },

  askCanceled: (data: {
    principal: string
    auction_id: string
    ask_amount: string
    price: string
    asset: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Ask Canceled', {
      ...data,
      timestamp: now(),
    })
  },

  // Transaction Events
  depositCompleted: (data: {
    principal: string
    amount: string
    currency: string
    transaction_id: string
    usd_value: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Deposit Completed', {
      ...data,
      timestamp: now(),
    })
  },

  withdrawalCompleted: (data: {
    principal: string
    amount: string
    currency: string
    transaction_id: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Withdrawal Completed', {
      ...data,
      timestamp: now(),
    })
  },

  // Account Management Events
  demographicsCaptured: (data: {
    principal: string
    location: string
    device_type: string
  }) => {
    if (!import.meta.env.PROD) return
    mixpanel.track('Demographics Captured', {
      ...data,
      timestamp: now(),
    })
  },
}
