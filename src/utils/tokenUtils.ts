import { HttpAgent } from '@dfinity/agent'
import {
  IcrcTokenMetadataResponse,
  IcrcMetadataResponseEntries,
  IcrcLedgerCanister,
} from '@dfinity/ledger-icrc'
import { Principal } from '@dfinity/principal'

import defSymbolLogo from '../assets/img/coins/default.svg'
import { TokenMetadata } from '../types'

const quoteTokenDefault = process.env.ENV_TOKEN_QUOTE_DEFAULT || 'USDT'

/**
 * Parses the metadata response from the ICRC token canister to extract token information.
 *
 * @param metadata - The metadata response from the ICRC token canister.
 * @param quoteToken - The quote token selected.
 * @returns The extracted token metadata.
 */
const parseMetadata = (
  metadata: IcrcTokenMetadataResponse,
  quoteToken: string | null,
): TokenMetadata => {
  let symbol = 'unknown'
  let name = 'unknown'
  let decimals = 0
  let logo = ''
  let fee = 0

  metadata.forEach((entry) => {
    switch (entry[0]) {
      case IcrcMetadataResponseEntries.SYMBOL:
        symbol = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.NAME:
        name = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.DECIMALS:
        decimals = Number((entry[1] as unknown as { Nat: string }).Nat)
        break
      case IcrcMetadataResponseEntries.LOGO:
        logo = (entry[1] as { Text: string }).Text
        break
      case IcrcMetadataResponseEntries.FEE:
        fee = Number((entry[1] as unknown as { Nat: string }).Nat)
        break
    }
  })

  if (symbol.includes('ck') || name.includes('ck')) {
    symbol = symbol.replace('ck', '')
    name = name.replace('ck', '')
  }

  return {
    symbol,
    name,
    decimals,
    logo,
    fee,
    feeNat: fee.toString(),
    base: symbol,
    quote: quoteToken ? quoteToken : quoteTokenDefault,
  }
}

/**
 * Finds and returns the logo URL for a given token.
 * If the logo is not provided in the token metadata, it attempts to fetch the logo from a default location.
 *
 * @param token - The token metadata object.
 * @returns A promise that resolves to the logo URL.
 */
const findLogo = async (token: TokenMetadata): Promise<string> => {
  let logo =
    token.logo ||
    new URL(
      `../assets/img/coins/${token.symbol.toLowerCase()}.svg`,
      import.meta.url,
    ).href

  if (!token.logo) {
    try {
      const response = await fetch(logo)
      const blob = await response.blob()
      if (blob.size === 0 || !blob.type.startsWith('image')) {
        throw new Error('Image not found or not an image')
      }
    } catch (error) {
      logo = defSymbolLogo
    }
  }

  return logo
}

/**
 * Retrieves the token information from the ICRC token canister, including the parsed metadata and logo URL.
 *
 * @param userAgent - The HTTP agent to interact with the canister.
 * @param canisterId - The principal ID of the ICRC token canister.
 * @param quoteToken - The quote token selected.
 * @returns A promise that resolves to an object containing the token metadata and logo URL.
 */
export async function getTokenInfo(
  userAgent: HttpAgent,
  canisterId: Principal,
  quoteToken: string | null,
) {
  const { metadata } = IcrcLedgerCanister.create({
    agent: userAgent,
    canisterId: canisterId,
  })

  const principalData = await metadata({ certified: false })
  const token = parseMetadata(principalData, quoteToken)
  const logo = await findLogo(token)

  return { token, logo }
}

/**
 * Retrieves token metadata based on a provided principal or token base symbol.
 *
 * This function searches through an array of token metadata objects (`tokens`) to find a token
 * that matches the given `principal` or `token` (base symbol). If no match is found, a default
 * standard token object is returned.
 * @param tokens - An array of token metadata objects to search within.
 * @param principal - (Optional) The principal object used to identify a token. The function
 *                    compares the string representation of the principal with the `principal` field of tokens.
 * @param token - (Optional) The base symbol of the token to find. The function compares this value
 *                with the `base` field of tokens.
 * @returns - The metadata object of the matched token. If no match is found, a standard token object
 *            with default empty values is returned.
 */
export function getToken(
  tokens: TokenMetadata[],
  principal?: Principal,
  token?: string,
) {
  const standard = {
    symbol: '',
    name: '',
    decimals: 0,
    logo: '',
    fee: 0,
    feeNat: '0',
    quote: '',
    base: '',
    principal: '',
  }

  if (!tokens || tokens.length === 0) return standard

  if (principal) {
    const foundToken =
      tokens.find((t) => t.principal === principal.toText()) ?? standard
    return { ...foundToken }
  }

  if (token) {
    const foundToken = tokens.find((t) => t.base === token) ?? standard
    return { ...foundToken }
  }

  return standard
}
