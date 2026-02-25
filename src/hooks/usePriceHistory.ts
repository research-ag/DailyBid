import { HttpAgent } from '@icp-sdk/core/agent'
import { Principal } from '@icp-sdk/core/principal'

import { Option, TokenMetadata, Statistics, NextSession } from '../types'
import {
  convertPriceFromCanister,
  convertVolumeFromCanister,
  getDecimals,
} from '../utils/calculationsUtils'
import { getActor } from '../utils/canisterUtils'

/**
 * Custom hook for fetching and managing price history.
 */
const usePriceHistory = () => {
  /**
   * Fetches and returns the statistics.
   *
   * @param userAgent - The HTTP agent to interact with the canister.
   * @param selectedSymbol - The selected token option, which may include the principal.
   * @param selectedQuote - The selected token metadata for the quote currency.
   * @returns A promise that resolves to the statistics.
   */
  const getStatistics = async (
    userAgent: HttpAgent,
    selectedSymbol: Option,
    selectedQuote: TokenMetadata,
  ): Promise<Statistics | null> => {
    try {
      const principal = selectedSymbol?.principal
      if (!principal) return null

      const serviceActor = getActor(userAgent)

      const indicativeStats = await serviceActor.indicativeStats(
        Principal.fromText(principal),
      )

      let clearingPrice = null,
        clearingVolume = null,
        minAskPrice = null,
        maxBidPrice = null
      let formattedClearingPrice = null,
        formattedClearingVolume = null
      let formattedMinAskPrice = null,
        formattedMaxBidPrice = null

      if ('match' in indicativeStats.clearing) {
        clearingPrice = indicativeStats.clearing.match.price
        clearingVolume = indicativeStats.clearing.match.volume

        formattedClearingPrice = convertPriceFromCanister(
          Number(clearingPrice),
          getDecimals(selectedSymbol),
          getDecimals(selectedQuote),
        )

        formattedClearingVolume = convertVolumeFromCanister(
          Number(clearingVolume),
          getDecimals(selectedSymbol),
          0,
        ).volumeInBase
      } else if ('noMatch' in indicativeStats.clearing) {
        minAskPrice = indicativeStats.minAskPrice
        maxBidPrice = indicativeStats.maxBidPrice

        formattedMinAskPrice =
          minAskPrice !== null
            ? convertPriceFromCanister(
                Number(minAskPrice),
                getDecimals(selectedSymbol),
                getDecimals(selectedQuote),
              )
            : null

        formattedMaxBidPrice =
          maxBidPrice !== null
            ? convertPriceFromCanister(
                Number(maxBidPrice),
                getDecimals(selectedSymbol),
                getDecimals(selectedQuote),
              )
            : null
      }

      const totalAskVolume = indicativeStats.totalAskVolume || null
      const totalBidVolume = indicativeStats.totalBidVolume || null

      const formattedTotalAskVolume =
        totalAskVolume !== null
          ? convertVolumeFromCanister(
              Number(totalAskVolume),
              getDecimals(selectedSymbol),
              0,
            ).volumeInBase
          : null

      const formattedTotalBidVolume =
        totalBidVolume !== null
          ? convertVolumeFromCanister(
              Number(totalBidVolume),
              getDecimals(selectedSymbol),
              0,
            ).volumeInBase
          : null

      return {
        clearingPrice: formattedClearingPrice,
        clearingVolume: formattedClearingVolume,
        minAskPrice: formattedMinAskPrice,
        maxBidPrice: formattedMaxBidPrice,
        totalAskVolume: formattedTotalAskVolume,
        totalBidVolume: formattedTotalBidVolume,
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
      return null
    }
  }

  /**
   * Fetches and returns the next auction.
   *
   * @param userAgent - The HTTP agent to interact with the canister.
   * @returns A promise that resolves to the statistics.
   */
  const getNextSession = async (
    userAgent: HttpAgent,
  ): Promise<NextSession | null> => {
    try {
      const serviceActor = getActor(userAgent)

      const { counter, timestamp } = await serviceActor.nextSession()
      const date = new Date(Number(timestamp) * 1000)
      const datetime = Number(timestamp) * 1000
      const optionsDateTime: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
      }
      const formattedDateTime = date.toLocaleDateString(
        'en-US',
        optionsDateTime,
      )

      return {
        nextSession: formattedDateTime,
        datetime,
        counter: String(counter),
      }
    } catch (error) {
      console.error('Error fetching next auction:', error)
      return null
    }
  }

  return { getStatistics, getNextSession }
}

export default usePriceHistory
