import { ImmediateOrderBookInfo } from '@declarations/icrc1_auction/icrc1_auction.did'

import { DataItem, HeaderInformation } from '../types'
import {
  fixDecimal,
  convertPriceFromCanister,
} from '../utils/calculationsUtils'

/**
 * Calculates and returns the header information based on the given prices and order book info.
 * The header information includes the current bid/ask spread, the previous price change in amount and percentage,
 * and the total volume over a specific period.
 *
 * @param prices - An array of DataItem objects containing price and volume information.
 * @param orderBookInfo - Immediate order book information.
 * @returns The calculated HeaderInformation object.
 */
export function calculateHeaderInformation(
  prices: DataItem[],
  orderBookInfo: ImmediateOrderBookInfo,
) {
  const baseDecimals = prices[0]?.baseDecimals
  const quoteDecimals = prices[0]?.quoteDecimals

  const rawMaxBid = orderBookInfo?.maxBidPrice?.[0] ?? null
  const rawMinAsk = orderBookInfo?.minAskPrice?.[0] ?? null

  const canConvert =
    rawMaxBid !== null || rawMinAsk !== null
      ? typeof baseDecimals === 'number' &&
        typeof quoteDecimals === 'number' &&
        baseDecimals >= 0 &&
        quoteDecimals >= 0 &&
        (baseDecimals > 0 || quoteDecimals > 0)
      : false

  const convertedMaxBid =
    rawMaxBid !== null && canConvert
      ? convertPriceFromCanister(
          Number(rawMaxBid),
          baseDecimals as number,
          quoteDecimals as number,
        )
      : null

  const convertedMinAsk =
    rawMinAsk !== null && canConvert
      ? convertPriceFromCanister(
          Number(rawMinAsk),
          baseDecimals as number,
          quoteDecimals as number,
        )
      : null

  let headerInformation: HeaderInformation = {
    currentBidAsk: [convertedMaxBid, convertedMinAsk],
    previousChange: {
      amount: '',
      percentage: '',
    },
    periodVolume: '',
    priceDigitsLimit: 0,
  }

  function calculatePrices(
    prices: DataItem[],
    headerInformation: HeaderInformation,
  ) {
    if (prices.length) {
      const priceDigitsLimit = prices[0].priceDigitsLimit || 5
      const lastPrice = prices[0].price

      let previousPrice = lastPrice
      if (prices.length >= 2) previousPrice = prices[1].price

      const changeInDollar = lastPrice - previousPrice

      const changeInPercentage =
        previousPrice !== 0
          ? ((lastPrice - previousPrice) / previousPrice) * 100
          : 0

      headerInformation = {
        currentBidAsk: headerInformation.currentBidAsk,
        previousChange: {
          amount: Number(fixDecimal(changeInDollar, priceDigitsLimit)),
          percentage: changeInPercentage,
        },
        periodVolume: '',
        priceDigitsLimit,
      }
    }
    return headerInformation
  }

  function calculateVolume(prices: DataItem[]) {
    if (prices.length) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      const filtered = prices.filter((item) => {
        const itemDate = new Date(item.datetime)
        return itemDate >= startDate
      })

      const totalVolume = filtered.reduce((accumulator, currentItem) => {
        return accumulator + currentItem.volumeInQuote
      }, 0)

      return totalVolume
    }

    return 0
  }

  headerInformation = calculatePrices(prices, headerInformation)
  headerInformation.periodVolume = calculateVolume(prices)

  return headerInformation
}
