import { HttpAgent } from '@dfinity/agent'

import { TokenMetadata, TokenDataItem } from '../../types'
import { convertVolumeFromCanister } from '../../utils/calculationsUtils'
import { getActor } from '../../utils/canisterUtils'
import { getToken } from '../../utils/tokenUtils'
import { AUCTION_QUERY_EMPTY_PARAMS } from '../useAuctionQuery.ts'

/**
 * Custom hook for fetching and managing deposit/withdraw history.
 */
const useDepositHistory = () => {
  /**
   * Fetches the deposit/withdraw history for a user.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param tokens - An array of token objects.
   * @returns - A promise that resolves to an array of formatted token deposit/withdraw data items.
   */
  const getDepositHistory = async (
    userAgent: HttpAgent,
    tokens: TokenMetadata[],
  ): Promise<TokenDataItem[]> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const serviceActor = getActor(userAgent)

      const histories = await serviceActor
        .auction_query([], {
          ...AUCTION_QUERY_EMPTY_PARAMS,
          deposit_history: [[BigInt(10000), BigInt(0)]],
        })
        .then((r) => r.deposit_history)

      const formattedData = (histories ?? [])
        .reverse()
        .map(([ts, actionObj, tokenPrincipal, volume], index) => {
          const date = new Date(Number(ts) / 1_000_000)
          const optionsDateTime: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          }
          const formattedDateTime = date.toLocaleDateString(
            'en-US',
            optionsDateTime,
          )

          const action = Object.keys(actionObj)[0]

          const token = getToken(tokens, tokenPrincipal)

          const { volumeInBase } = convertVolumeFromCanister(
            Number(volume),
            token.decimals,
            0,
          )

          return {
            id: BigInt(index),
            datetime: formattedDateTime,
            price: 0,
            volume: volumeInBase,
            volumeInBase,
            volumeInQuote: 0,
            action,
            ...token,
          }
        })

      return formattedData
    } catch (error) {
      console.error('Error fetching deposit history:', error)
      return []
    }
  }

  return { getDepositHistory }
}

export default useDepositHistory
