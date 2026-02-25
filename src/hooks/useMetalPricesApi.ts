import { HttpAgent } from '@icp-sdk/core/agent'

import { TokenApi } from '../types'
import { getActorMetalPriceApi } from '../utils/canisterMetalPriceApiUtils'

/**
 * Custom hook for fetching and managing prices from metal price api.
 */
const useMetalPriceApi = () => {
  /**
   * Fetches the price in real time and maps token data with corresponding prices.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @returns - A promise that resolves to an array of enriched token metadata with prices.
   */
  const getMetalPriceApi = async (
    userAgent: HttpAgent,
  ): Promise<TokenApi[]> => {
    try {
      if (!process.env.ENV_METAL_PRICES_API_TOKENS) {
        throw new Error('ENV_METAL_PRICES_API_TOKENS is not defined')
      }

      // Parse the tokens and their names from the environment variable
      const tokensWithNames = process.env.ENV_METAL_PRICES_API_TOKENS.split(',')

      // Create a mapping of symbols to their names
      const tokenMap: Record<string, string> = tokensWithNames.reduce(
        (map, pair) => {
          const [symbol, name] = pair.split(':')
          map[symbol] = name
          return map
        },
        {} as Record<string, string>,
      )

      // Extract symbols from the token map
      const apiTokens = Object.keys(tokenMap)

      // Map tokens to USD-prefixed symbols
      const usdTokens = apiTokens.map((token) => `USD${token}`)

      // Initialize the service actor and fetch prices
      const serviceActor = getActorMetalPriceApi(userAgent)
      const prices = await serviceActor.queryRates(usdTokens)

      // Map prices back to their corresponding token metadata
      const tokenObjects = apiTokens.flatMap((token, index) => {
        const priceData = prices[index]?.['1']['0']

        // Creation of the base token
        const tokenObject = {
          symbol: token,
          name: tokenMap[token] || 'Unknown',
          timestamp: priceData ? priceData.timestamp : 0n,
          value: priceData ? priceData.value : 0,
        }

        // XAU (kg) calculation
        if (token === 'XAU') {
          const xauKgValue = tokenObject.value / 0.0311035
          const xauKgToken = {
            symbol: 'XAU (kg)',
            name: 'Gold',
            timestamp: tokenObject.timestamp,
            value: xauKgValue,
          }
          return [tokenObject, xauKgToken]
        }

        return [tokenObject]
      })

      return tokenObjects
    } catch (error) {
      console.error('Error fetching metal price API:', error)
      return []
    }
  }

  return { getMetalPriceApi }
}

export default useMetalPriceApi
