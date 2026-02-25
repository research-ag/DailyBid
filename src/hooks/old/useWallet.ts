import {
  IcrcLedgerCanister,
  decodeIcrcAccount,
} from '@icp-sdk/canisters/ledger/icrc'
import { HttpAgent } from '@icp-sdk/core/agent'
import { Principal } from '@icp-sdk/core/principal'

import { TokenDataItem, TokenMetadata, Result } from '../../types'
import {
  convertVolumeFromCanister,
  getDecimals,
  addDecimal,
} from '../../utils/calculationsUtils'
import { getActor } from '../../utils/canisterUtils'
import { getAuctionCanisterId } from '../../utils/canisterUtils'
import {
  hexToUint8Array,
  getSubAccountFromPrincipal,
} from '../../utils/convertionsUtils'
import { getToken } from '../../utils/tokenUtils'
import { AUCTION_QUERY_EMPTY_PARAMS } from '../useAuctionQuery.ts'

/**
 * Custom hook for fetching and managing user wallet.
 */
const useWallet = () => {
  /**
   * Fetches and processes balances with credits details for the user.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param tokens - An array of token objects.
   * @returns A promise that resolves to an array of TokenDataItem objects containing the user's token balances with credits details.
   */
  const getBalancesCredits = async (
    userAgent: HttpAgent,
    tokens: TokenMetadata[],
  ): Promise<TokenDataItem[]> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const serviceActor = getActor(userAgent)

      const balancesRaw = await serviceActor
        .auction_query([], { ...AUCTION_QUERY_EMPTY_PARAMS, credits: [true] })
        .then((r) => r.credits)

      const creditsMap = (balancesRaw ?? []).reduce(
        (acc, [principal, credits]) => {
          acc[principal.toText()] = credits
          return acc
        },
        {} as Record<string, any>,
      )

      const balances: TokenDataItem[] = tokens.map((token, index) => {
        const principal = token.principal || ''
        const credits = creditsMap[principal] || {
          available: 0,
          locked: 0,
          total: 0,
        }

        const { volumeInBase: volumeInAvailable } = convertVolumeFromCanister(
          Number(credits.available),
          getDecimals(token),
          0,
        )

        const { volumeInBase: volumeInLocked } = convertVolumeFromCanister(
          Number(credits.locked),
          getDecimals(token),
          0,
        )

        const { volumeInBase: volumeInTotal } = convertVolumeFromCanister(
          Number(credits.total),
          getDecimals(token),
          0,
        )

        return {
          id: BigInt(index),
          datetime: '',
          price: 0,
          volume: 0,
          volumeInQuote: 0,
          volumeInBase: volumeInAvailable,
          volumeInAvailable,
          volumeInAvailableNat: String(credits.available),
          volumeInLocked,
          volumeInLockedNat: String(credits.locked),
          volumeInTotal,
          volumeInTotalNat: String(credits.total),
          ...token,
        }
      })

      const data = addDecimal(balances, 4)
      data.sort((a, b) => a.symbol.localeCompare(b.symbol))

      return data
    } catch (error) {
      console.error('Error fetching balances with credits:', error)
      return []
    }
  }

  /**
   * Fetches the balance for a given token and account.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param tokens - An array of token objects.
   * @param principal - The principal ID of the token as a string.
   * @param account - The account identifier as a string.
   * @param action - Action to identify which account should be monitored
   * @returns The balance or an empty array in case of an error.
   */
  const getBalance = async (
    userAgent: HttpAgent,
    tokens: TokenMetadata[],
    principal: string,
    account: string,
    action: string,
  ): Promise<number | []> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const tokenCanisterId = Principal.fromText(principal)

      const auctionCanisterId = getAuctionCanisterId()

      const { balance } = IcrcLedgerCanister.create({
        agent: userAgent,
        canisterId: tokenCanisterId,
      })

      const decodeAccount = decodeIcrcAccount(account)
      let owner = decodeAccount.owner
      let subaccount = decodeAccount.subaccount

      if (action === 'claim') {
        owner = Principal.fromText(auctionCanisterId)
        const hexSubAccountId = getSubAccountFromPrincipal(account).subAccountId
        subaccount = new Uint8Array(hexToUint8Array(hexSubAccountId))
      }

      const myBalance = await balance({
        owner: owner,
        subaccount: subaccount,
        certified: false,
      })

      const token = getToken(tokens, tokenCanisterId)

      const { volumeInBase } = convertVolumeFromCanister(
        Number(myBalance),
        getDecimals(token),
        0,
      )

      return volumeInBase
    } catch (error) {
      return []
    }
  }

  /**
   * Fetches the tracked deposit for a given principal or all balances if no principal is provided.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param tokens - An array of token objects representing metadata for the tokens.
   * @param principal - (Optional) The principal ID as a string. If provided, fetches the deposit for the specific principal.
   *                    If not provided, fetches the balances for all available tokens.
   * @returns An array of objects containing token metadata and the corresponding tracked deposit volume in base units.
   *          If a specific principal is provided, the array contains a single object. If an error occurs, returns 0.
   */
  const getTrackedDeposit = async (
    userAgent: HttpAgent,
    tokens: TokenMetadata[],
    principal?: string,
  ): Promise<{ token: TokenMetadata; volumeInBase: number }[] | Result> => {
    try {
      if (!tokens || tokens.length === 0) return []

      const serviceActor = getActor(userAgent)

      if (principal) {
        const tokenCanisterId = Principal.fromText(principal)

        const deposit: Result = await serviceActor.icrc84_query([
          tokenCanisterId,
        ])

        const volume = deposit[0] ? deposit[0][1]['tracked_deposit'] : undefined

        const token = getToken(tokens, tokenCanisterId)

        if (volume !== undefined) {
          const { volumeInBase } = convertVolumeFromCanister(
            Number(volume),
            getDecimals(token),
            0,
          )

          return [{ token, volumeInBase }]
        } else {
          return [{ token, volumeInBase: 0 }]
        }
      } else {
        const deposits: Array<Result> = await serviceActor.icrc84_query([])
        if (deposits.length === 0) {
          return tokens.map((token) => ({
            token,
            volumeInBase: 0,
          }))
        }

        return deposits.map((deposit) => {
          const tokenCanisterId = deposit[0]
          const token = getToken(tokens, tokenCanisterId)

          const volume = deposit[1]['tracked_deposit']
          const { volumeInBase } = convertVolumeFromCanister(
            Number(volume ?? 0),
            getDecimals(token),
            0,
          )

          return { token, volumeInBase }
        })
      }
    } catch (error) {
      console.error('Error fetching tracked deposit:', error)
      return []
    }
  }

  /**
   * Notifies the service actor to update the balance information for a specific token.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param principal - The principal identifier of the token.
   * @returns A promise that resolves to the result of the notification operation.
   */
  const balanceNotify = async (
    userAgent: HttpAgent,
    principal: string | undefined,
  ) => {
    try {
      if (!principal) return []

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.icrc84_notify({
        token: Principal.fromText(principal),
      })

      return result
    } catch (error) {
      console.error('Error balance notify:', error)
      return []
    }
  }

  /**
   * Withdraws credit from the user's account using the ICRC-84 protocol.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @param amount - The amount of credit to withdraw.
   * @returns The result of the withdrawal transaction.
   */
  const withdrawCredit = async (
    userAgent: HttpAgent,
    principal: string | undefined,
    account: string | undefined,
    amount: number,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.icrc84_withdraw({
        token: Principal.fromText(principal),
        to: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        amount: BigInt(amount),
        expected_fee: [],
      })

      return result
    } catch (error) {
      console.error('Error withdraw credit:', error)
      return null
    }
  }

  /**
   * Get Deposit Allowance info from the user's account using the ICRC-84 protocol.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @returns The info of the deposit allowance.
   */
  const getDepositAllowanceInfo = async (
    userAgent: HttpAgent,
    principal: string | undefined,
    account: string | undefined,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const auctionCanisterId = getAuctionCanisterId()

      const userPrincipal = await userAgent.getPrincipal()
      const hexSubAccountId = getSubAccountFromPrincipal(
        userPrincipal.toText(),
      ).subAccountId

      const ledgerActor = IcrcLedgerCanister.create({
        agent: userAgent,
        canisterId: Principal.fromText(principal),
      })
      const result = await ledgerActor.allowance({
        account: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        spender: {
          owner: Principal.fromText(auctionCanisterId),
          subaccount: [new Uint8Array(hexToUint8Array(hexSubAccountId))],
        },
        certified: false,
      })

      return result
    } catch (error) {
      return null
    }
  }

  /**
   * Deposit credit from the user's account using the ICRC-84 protocol.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @param principal - The principal identifier of the token.
   * @param account - The account identifier as a hexadecimal string.
   * @param amount - The amount of credit to withdraw.
   * @returns The result of the deposit transaction.
   */
  const deposit = async (
    userAgent: HttpAgent,
    principal: string | undefined,
    account: string | undefined,
    amount: number,
  ) => {
    try {
      if (!principal || !account) return null

      const decodeAccount = decodeIcrcAccount(account)

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.icrc84_deposit({
        token: Principal.fromText(principal),
        from: {
          owner: decodeAccount.owner,
          subaccount: decodeAccount?.subaccount
            ? [decodeAccount.subaccount]
            : [],
        },
        amount: BigInt(amount),
        expected_fee: [],
      })

      return result
    } catch (error) {
      console.error('Error deposit credit:', error)
      return null
    }
  }

  /**
   * Retrieves the user's points by querying the service actor.
   *
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @returns - A promise that resolves to the user's points if the query is successful, or `null` in case of an error.
   */
  const getUserPoints = async (userAgent: HttpAgent) => {
    try {
      const serviceActor = getActor(userAgent)
      const result = await serviceActor.auction_query(
        [],
        AUCTION_QUERY_EMPTY_PARAMS,
      )
      return result.points
    } catch (error) {
      console.error('Error query user points:', error)
      return null
    }
  }

  /**
   * Retrieves the Bitcoin deposit address for the user.
   * @param userAgent - An instance of HttpAgent used for making authenticated requests.
   * @returns - A promise that resolves to the Bitcoin deposit address as a string or null if an error occurs.
   */
  const getBtcDepositAddress = async (
    userAgent: HttpAgent,
  ): Promise<string | null> => {
    try {
      const serviceActor = getActor(userAgent)
      const result = await serviceActor.btc_depositAddress([])
      return result
    } catch (error) {
      console.error('Error retrieving Bitcoin deposit address:', error)
      return null
    }
  }

  /**
   * Initiates a Bitcoin withdrawal transaction using the ICRC-84 protocol.
   * @param userAgent - An instance of HttpAgent for making authenticated requests.
   * @param to - The recipient's Bitcoin address.
   * @param amount - The amount to withdraw.
   * @returns The result of the withdrawal transaction or null if an error occurs.
   */
  const btcWithdrawCredit = async (
    userAgent: HttpAgent,
    to: string,
    amount: number,
  ) => {
    try {
      if (!to || !amount) return null

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.btc_withdraw({
        amount: BigInt(amount),
        to,
      })

      return result
    } catch (error) {
      console.error('Error btc withdraw credit:', error)
      return null
    }
  }

  /**
   * Retrieves the status of a Bitcoin withdrawal transaction.
   * @param userAgent - An instance of HttpAgent for making authenticated requests.
   * @param blockIndex - The block index of the withdrawal transaction.
   * @returns The status of the withdrawal transaction or null if an error occurs.
   */
  const btcWithdrawStatus = async (
    userAgent: HttpAgent,
    blockIndex: bigint,
  ) => {
    try {
      if (!blockIndex) return null

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.btc_withdrawal_status({
        block_index: blockIndex,
      })

      return result
    } catch (error) {
      console.error('Error btc withdraw status:', error)
      return null
    }
  }

  /**
   * Withdraws a specified amount of cycles to a given principal address using the provided HttpAgent.
   * @param userAgent - The authenticated agent to interact with the canister.
   * @param to - The principal ID of the recipient.
   * @param amount - The amount of cycles to withdraw.
   * @returns - A Promise resolving to the withdrawal result or null if an error occurs.
   */
  const cyclesWithdrawCredit = async (
    userAgent: HttpAgent,
    to: string,
    amount: number,
  ) => {
    try {
      if (!to || !amount) return null

      const serviceActor = getActor(userAgent)
      const result = await serviceActor.cycles_withdraw({
        amount: BigInt(amount),
        to: Principal.fromText(to),
      })

      return result
    } catch (error) {
      console.error('Error cycles withdraw credit:', error)
      return null
    }
  }

  return {
    getBalancesCredits,
    getBalance,
    getTrackedDeposit,
    balanceNotify,
    withdrawCredit,
    getDepositAllowanceInfo,
    deposit,
    getUserPoints,
    getBtcDepositAddress,
    btcWithdrawCredit,
    btcWithdrawStatus,
    cyclesWithdrawCredit,
  }
}

export default useWallet
