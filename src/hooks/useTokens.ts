import { HttpAgent } from '@dfinity/agent'

import { TokenMetadata } from '../types'
import { convertVolumeFromCanister } from '../utils/calculationsUtils'
import { getActor } from '../utils/canisterUtils'
import { getTokenInfo } from '../utils/tokenUtils'

/**
 * Custom hook for fetching and managing tokens.
 */
const useTokens = () => {
  /**
   * Fetches and returns the supported tokens.
   *
   * @param userAgent - The HTTP agent to interact with the canister.
   * @returns A promise that resolves to an array of TokenMetadata objects representing the supported tokens.
   */
  const getTokens = async (
    userAgent: HttpAgent,
  ): Promise<{ tokens: TokenMetadata[]; quoteToken: TokenMetadata | null }> => {
    try {
      const serviceActor = getActor(userAgent)

      const [quoteToken, principals] = await Promise.all([
        getQuoteToken(userAgent),
        serviceActor.icrc84_supported_tokens(),
      ])

      const tokens = await Promise.all(
        (principals ?? []).map(async (principal) => {
          const { token, logo } = await getTokenInfo(
            userAgent,
            principal,
            `${quoteToken?.base}`,
          )

          const { volumeInBase } = convertVolumeFromCanister(
            Number(token.fee),
            token.decimals,
            0,
          )

          return {
            ...token,
            fee: volumeInBase,
            logo,
            principal: principal.toText(),
          }
        }),
      )
      tokens.sort((a, b) => a.symbol.localeCompare(b.symbol))
      return { tokens, quoteToken }
    } catch (error) {
      console.error('Error fetching tokens:', error)
      return { tokens: [], quoteToken: null }
    }
  }

  /**
   * Fetches and returns the quote token.
   *
   * @param userAgent - The HTTP agent to interact with the canister.
   * @returns A promise that resolves to the quote token.
   */
  const getQuoteToken = async (
    userAgent: HttpAgent,
  ): Promise<TokenMetadata | null> => {
    try {
      const serviceActor = getActor(userAgent)

      const quotePrincipal = await serviceActor.getQuoteLedger()
      const { token, logo } = await getTokenInfo(
        userAgent,
        quotePrincipal,
        null,
      )

      const { volumeInBase: fee } = convertVolumeFromCanister(
        Number(token.fee),
        token.decimals,
        0,
      )

      return {
        ...token,
        fee,
        logo,
        principal: quotePrincipal.toText(),
      }
    } catch (error) {
      console.error('Error fetching quote token:', error)
      return null
    }
  }

  return { getTokens, getQuoteToken }
}

export default useTokens
