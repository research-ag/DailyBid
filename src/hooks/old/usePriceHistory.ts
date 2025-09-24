import { HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

import {
  DataItem,
  Option,
  TokenMetadata,
  Statistics,
  NextSession,
} from '../../types'
import {
  convertPriceFromCanister,
  convertVolumeFromCanister,
  getDecimals,
  addDecimal,
} from '../../utils/calculationsUtils'
import { getActor } from '../../utils/canisterUtils'
import { AUCTION_QUERY_EMPTY_PARAMS } from '../useAuctionQuery.ts'

/**
 * Custom hook for fetching and managing price history.
 */
const usePriceHistory = () => {
  /**
   * Fetches and returns the price history for a selected symbol.
   *
   * @param userAgent - The HTTP agent to interact with the canister.
   * @param selectedSymbol - The selected token option, which may include the principal.
   * @param selectedQuote - The selected token metadata for the quote currency.
   * @param priceDigitsLimit - The limit number of digits places defined by the canister
   * @returns A promise that resolves to an array of DataItem objects representing the price history.
   */
  const getPriceHistory = async (
    userAgent: HttpAgent,
    selectedSymbol: Option,
    selectedQuote: TokenMetadata,
    priceDigitsLimit: number,
  ): Promise<DataItem[]> => {
    try {
      const principal = selectedSymbol?.principal
      if (!principal) return []

      const serviceActor = getActor(userAgent)

      const prices = await serviceActor
        .auction_query([Principal.fromText(principal)], {
          ...AUCTION_QUERY_EMPTY_PARAMS,
          price_history: [[BigInt(10000), BigInt(0), true]],
        })
        .then((r) => r.price_history)

      const formattedData: DataItem[] = (prices ?? [])
        //.reverse()
        .filter(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_ts, _sessionNumber, _ledger, _volume, price]) =>
            Number(price) !== 0,
        )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([ts, _sessionNumber, _ledger, volume, price], index) => {
          const date = new Date(Number(ts) / 1_000_000)
          const optionsDateTime: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
          }
          const formattedDateTime = date.toLocaleDateString(
            'en-US',
            optionsDateTime,
          )
          const optionsDate: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }
          const formattedDate = date.toLocaleDateString('en-US', optionsDate)
          const optionsTime: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }
          const formattedTime = date.toLocaleTimeString('en-US', optionsTime)

          const formattedPrice = convertPriceFromCanister(
            Number(price),
            getDecimals(selectedSymbol),
            getDecimals(selectedQuote),
          )

          const { volumeInQuote, volumeInBase } = convertVolumeFromCanister(
            Number(volume),
            getDecimals(selectedSymbol),
            formattedPrice,
          )

          return {
            id: BigInt(index),
            datetime: formattedDateTime,
            date: formattedDate,
            time: formattedTime,
            price: formattedPrice,
            volume: volumeInBase,
            volumeInQuote,
            volumeInBase,
            quoteDecimals: selectedQuote.decimals,
            priceDigitsLimit,
          }
        })

      const data = addDecimal(formattedData, 2)

      return data
    } catch (error) {
      console.error('Error fetching prices:', error)
      return []
    }
  }

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

  return { getPriceHistory, getStatistics, getNextSession }
}

export default usePriceHistory
