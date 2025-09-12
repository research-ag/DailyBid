import { useEffect, useState, useCallback } from 'react'

import { useSelector, useDispatch } from 'react-redux'

import useAuctionQuery from '../hooks/useAuctionQuery'
import usePriceHistory from '../hooks/usePriceHistory'
import { RootState, AppDispatch } from '../store'
import { logout } from '../store/auth'
import { setUserPoints } from '../store/auth'
import { setBalances } from '../store/balances'
import { setOpenOrders } from '../store/orders'
import {
  setHeaderInformation,
  setPricesHistory,
  setNextSession,
} from '../store/prices'
import { setTrades } from '../store/trades'
import { checkUserAgentDelegation } from '../utils/authUtils'
import { calculateHeaderInformation } from '../utils/headerInformationUtils'
import { analytics } from '../utils/mixpanelUtils'

/**
 * NextClearingComponent
 *
 * Manages the timing and data updates related to auction sessions.
 * This component doesn't render any UI elements but handles:
 * - Tracking when the next auction session occurs
 * - Fetching updated data before new sessions
 * - Updating the Redux store with latest information
 * - Session validation
 */
const NextClearingComponent: React.FC = () => {
  // State for tracking the next auction session
  const [nextSessionTime, setNextSessionTime] = useState<Date | null>(null)

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>()

  // Redux selectors
  const tokens = useSelector((state: RootState) => state.tokens.tokens)
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const orderSettings = useSelector(
    (state: RootState) => state.orders.orderSettings,
  )
  const userPrincipal = useSelector(
    (state: RootState) => state.auth.userPrincipal,
  )
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const selectedQuote = useSelector(
    (state: RootState) => state.tokens.selectedQuote,
  )

  // Handle array or single value for selectedSymbol
  const symbol = Array.isArray(selectedSymbol)
    ? selectedSymbol[0]
    : selectedSymbol

  // Custom hooks for API interactions
  const { getNextSession } = usePriceHistory()
  const { getQuerys } = useAuctionQuery()

  /**
   * Fetches the next session information from the API
   * Sets the next session time and identifier
   */
  const fetchNextSession = useCallback(async () => {
    const info = await getNextSession(userAgent)

    if (info?.datetime) {
      const auctionDate = new Date(info.datetime)
      setNextSessionTime(auctionDate)
    }
    dispatch(setNextSession(info?.nextSession || null))
  }, [])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let isActive = true // Flag to control concurrent executions

    /**
     * Starts polling for next session data
     * Ensures any existing polling is stopped before starting new one
     */
    const startPolling = () => {
      // Clear any existing interval first
      stopPolling()

      intervalId = setInterval(() => {
        if (isActive) {
          fetchNextSession()
        }
      }, 2000)
    }

    /**
     * Stops the polling interval if active
     */
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    /**
     * Handles the timing logic for the next session
     * - If session time is approaching, fetches updated data
     * - Manages polling based on time remaining
     */
    const handleSessionTime = async () => {
      if (!nextSessionTime || !isActive) return

      // Ensure existing timers are cleared
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      stopPolling()

      const now = new Date()
      const timeDifference = nextSessionTime.getTime() - now.getTime()

      if (timeDifference > 1000) {
        const timeToWait = timeDifference - 1000

        // Validate user session
        if (!checkUserAgentDelegation(userAgent)) {
          dispatch(logout())
          // Mixpanel event tracking [User Logged Out]
          analytics.userLoggedOut(userPrincipal)
          localStorage.removeItem('identity')
          localStorage.removeItem('delegationIdentity')
          localStorage.removeItem('mnemonicPhrase')
        }

        // Fetch updated data before the next session
        const [priceHistoryResult, userDataResult] = await Promise.all([
          getQuerys(userAgent, {
            selectedSymbol: symbol ?? undefined,
            selectedQuote: selectedQuote,
            priceDigitsLimit: orderSettings.orderPriceDigitsLimit,
            queryTypes: ['price_history'],
          }),
          getQuerys(userAgent, {
            tokens: tokens,
            selectedQuote: selectedQuote,
            priceDigitsLimit: orderSettings.orderPriceDigitsLimit,
            queryTypes: ['open_orders', 'transaction_history', 'credits'],
          }),
        ])

        // Only continue if the component is still mounted
        if (!isActive) return

        // Extract data from API responses
        const { pricesHistory: prices = [] } = priceHistoryResult
        const {
          orders: openOrdersRaw = [],
          trades: tradesRaw = [],
          credits: balancesCredits = [],
          points,
        } = userDataResult

        // Update Redux store with fetched data
        const headerInformation = calculateHeaderInformation(prices)
        dispatch(setHeaderInformation(headerInformation))
        dispatch(setPricesHistory(prices))
        dispatch(setBalances(balancesCredits))
        dispatch(setUserPoints(Number(points)))
        dispatch(setOpenOrders(openOrdersRaw))
        dispatch(setTrades(tradesRaw))

        // Wait until close to session time to start polling
        // Only create new timeout if component is still active
        if (isActive) {
          timeoutId = setTimeout(() => {
            if (isActive) {
              startPolling()
            }
          }, timeToWait)
        }
      } else {
        // If close to or past session time, start polling immediately
        if (isActive) {
          startPolling()
        }
      }
    }

    // Initialize based on whether we have a session time already
    if (nextSessionTime && isActive) {
      handleSessionTime()
    } else if (isActive) {
      fetchNextSession()
    }

    // Cleanup function to prevent memory leaks and ensure no timers remain active after unmount
    return () => {
      isActive = false // Prevents asynchronous operations after unmount
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      stopPolling()
    }
  }, [nextSessionTime, fetchNextSession, dispatch])

  // This component doesn't render anything visible
  return null
}

export default NextClearingComponent
