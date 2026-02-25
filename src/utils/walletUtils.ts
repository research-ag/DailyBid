import { Principal } from '@icp-sdk/core/principal'
import {
  CKBTC_MINTER_MAINNET_XPUBKEY,
  Minter,
} from '@research-ag/ckbtc-address-js'

import useMempool from '../hooks/useMempoolApi'
import { Result, NewBtcUtxo } from '../types'
import { convertVolumeFromCanister } from './calculationsUtils'
import {
  getSubAccountFromPrincipal,
  convertHexSubAccountToDecimals,
} from './convertionsUtils'

/**
 * Gets a user-friendly error message for a notify deposit error.
 *
 * @param error - An object representing the notify deposit error.
 * @returns A string with the corresponding error message.
 */
export const getErrorMessageNotifyDeposits = (error: Result): string => {
  const errorMessages: { [key: string]: string } = {
    NotAvailable: '',
    CallLedgerError: 'Call Ledger Error',
  }

  for (const key in error) {
    if (error[key] !== undefined && key in errorMessages) {
      return errorMessages[key]
    }
  }
  return 'Something went wrong'
}

/**
 * Gets a user-friendly error message for a withdraw error.
 *
 * @param error - An object representing the withdraw error.
 * @returns A string with the corresponding error message.
 */
export const getErrorMessageWithdraw = (error: Result): string => {
  const errorMessages: { [key: string]: string } = {
    AmountBelowMinimum: 'Amount Below Minimum',
    InsufficientCredit: 'Insufficient Credit',
    CallLedgerError: 'Call Ledger Error',
    BadFee: 'Badfee. Please retry.',
  }

  for (const key in error) {
    if (error[key] !== undefined && key in errorMessages) {
      return errorMessages[key]
    }
  }
  return 'Something went wrong'
}

/**
 * Gets a user-friendly error message for a deposit error.
 *
 * @param error - An object representing the deposit error.
 * @returns A string with the corresponding error message.
 */
export const getErrorMessageDeposit = (error: Result): string => {
  const errorMessages: { [key: string]: string | ((err: any) => string) } = {
    TransferError: (err) => (err?.message ? err.message : 'Transfer Error'),
    AmountBelowMinimum: 'Amount Below Minimum',
    CallLedgerError: 'Call Ledger Error',
    BadFee: 'Badfee. Please retry.',
  }

  for (const key in error) {
    if (error[key] !== undefined && key in errorMessages) {
      const messageOrFunction = errorMessages[key]

      if (typeof messageOrFunction === 'function') {
        return messageOrFunction(error[key])
      }

      return messageOrFunction as string
    }
  }

  return 'Something went wrong'
}

/**
 * Gets a user-friendly error message for a withdraw error.
 *
 * @param error - An object representing the withdraw error.
 * @returns A string with the corresponding error message.
 */
export const getErrorMessageBtcWithdraw = (error: Result): string => {
  const errorMessages: { [key: string]: string } = {
    MalformedAddress: 'Mal formed Address',
    GenericError: 'Generic Error',
    TemporarilyUnavailable: 'Temporarily Unavailable',
    InsufficientAllowance: 'Insufficient Allowance',
    AlreadyProcessing: 'Already Processing',
    Duplicate: 'Duplicate',
    InsufficientCredit: 'Insufficient Credit',
    BadFee: 'Bad Fee',
    AmountTooLow: 'Amount Too Low',
    AllowanceChanged: 'Allowance Changed',
    CreatedInFuture: 'Created In Future',
    TooOld: 'Too Old',
    Expired: 'Expired',
    InsufficientFunds: 'Insufficient Funds',
  }

  for (const key in error) {
    if (error[key] !== undefined && key in errorMessages) {
      return errorMessages[key]
    }
  }
  return 'Something went wrong'
}

/**
 * Gets a user-friendly error message for a withdraw error.
 *
 * @param error - An object representing the withdraw error.
 * @returns A string with the corresponding error message.
 */
export const getErrorMessageCyclesWithdraw = (error: Result): string => {
  const errorMessages: { [key: string]: string } = {
    FailedToWithdraw: 'Failed To Withdraw',
    GenericError: 'Generic Error',
    TemporarilyUnavailable: 'Temporarily Unavailable',
    Duplicate: 'Duplicate',
    InsufficientCredit: 'Insufficient Credit',
    BadFee: 'Bad Fee',
    InvalidReceiver: 'Invalid Receiver',
    CreatedInFuture: 'Created In Future',
    TooLowAmount: 'Too Low Amount',
    TooOld: 'Too Old',
    InsufficientFunds: 'Insufficient Funds',
  }

  for (const key in error) {
    if (error[key] !== undefined && key in errorMessages) {
      return errorMessages[key]
    }
  }
  return 'Something went wrong'
}

/**
 * Formats a wallet address by displaying the first 5 characters,
 * followed by ellipsis (...), and the last 3 characters.
 *
 * @param address - The wallet address to format.
 * @returns The formatted wallet address.
 */
export function formatWalletAddress(address: string): string {
  if (address.length <= 9) {
    return address
  }
  return `${address.slice(0, 5)}...${address.slice(-3)}`
}

/**
 * Generates a deposit address for BTC using a specific minter and user principal.
 *
 * @param userPrincipal - The user's principal as a string.
 * @returns - The generated deposit address.
 */
export const generateBtcDepositAddress = (userPrincipal: string): string => {
  const ckBtcMinter = new Minter(CKBTC_MINTER_MAINNET_XPUBKEY)

  const userToSubaccount = (user: Principal): Uint8Array => {
    const arr = Array.from(user.toUint8Array())
    arr.unshift(arr.length)
    while (arr.length < 32) {
      arr.unshift(0)
    }
    return new Uint8Array(arr)
  }

  return ckBtcMinter.depositAddr({
    owner: `${process.env.CANISTER_ID_ICRC_AUCTION}`,
    subaccount: userToSubaccount(Principal.fromText(userPrincipal)),
  })
}

/**
 * Generates a command string to deposit cycles into a canister on the Internet Computer.
 *
 * @param canisterId - The target canister ID to receive the cycles.
 * @param userPrincipal - The user's principal ID.
 * @param hexSubAccountId - Optional hexadecimal subaccount ID. If not provided, it will be derived from the user's principal.
 * @returns - The formatted command string for executing the deposit via `dfx`.
 */
export function depositCyclesCommandString(
  canisterId: string,
  userPrincipal: string,
  hexSubAccountId?: string | null,
) {
  const subAccountId = hexSubAccountId
    ? hexSubAccountId
    : getSubAccountFromPrincipal(userPrincipal).subAccountId

  const subAccountDecimals = convertHexSubAccountToDecimals(subAccountId)
  const commandString = `dfx canister --ic call um5iw-rqaaa-aaaaq-qaaba-cai deposit '(record {to = record {owner = principal "${canisterId}"; subaccount = opt vec {${subAccountDecimals}}}})' --wallet $(dfx identity get-wallet --ic) --with-cycles 0.1T`
  return commandString
}

/**
 * Calculates the number of confirmations for a list of UTXOs.
 *
 * @param utxos - An array of UTXOs to calculate confirmations for.
 * @returns A new array of UTXOs with updated confirmation counts.
 */
const calculateUtxoConfirmations = async (utxos: any[]): Promise<any[]> => {
  try {
    const { getCurrentBlockHeight } = useMempool()
    const currentBlockHeight = await getCurrentBlockHeight()
    if (!currentBlockHeight)
      throw new Error('Failed to fetch current block height.')

    return utxos.map((utxo) => ({
      ...utxo,
      confirmations: utxo.status.confirmed
        ? currentBlockHeight - utxo.status.block_height + 1
        : 0,
    }))
  } catch (err) {
    console.error('Error calculating UTXO confirmations:', err)
    return utxos
  }
}

/**
 * Retrieves the UTXOs for a user from the mempool.
 *
 * @param userBtcDeposit - The user's BTC deposit address.
 * @param ckBtcUtxo - The user's known UTXOs.
 * @param tokens - A list of token metadata for conversion.
 * @returns A list of new UTXOs from the mempool with confirmations.
 */
export const getMemPoolUtxos = async (
  userBtcDeposit: string,
  ckBtcUtxo: any[],
  tokens: any[],
): Promise<NewBtcUtxo[]> => {
  try {
    if (!userBtcDeposit) return []

    const { getMempoolAdressUtxo } = useMempool()
    const mempoolUtxos = await getMempoolAdressUtxo(userBtcDeposit)
    if (mempoolUtxos.length === 0) return []

    const mempoolUtxosWithConfirmations =
      await calculateUtxoConfirmations(mempoolUtxos)

    const knownTxids = new Set(ckBtcUtxo.map((utxo: any) => utxo.txid))

    return mempoolUtxosWithConfirmations
      .filter((utxo) => !knownTxids.has(utxo.txid))
      .map((utxo) => ({
        height: utxo.status.block_height,
        block_time: utxo.status.block_time,
        txid: utxo.txid,
        amount: convertVolumeFromCanister(
          Number(utxo.value),
          tokens.find((t) => t.base === 'BTC')?.decimals || 8,
          0,
        ).volumeInBase,
        confirmations: utxo.confirmations || 0,
      }))
      .sort((a, b) => b.confirmations - a.confirmations)
  } catch (error) {
    console.error('Error fetching new UTXOs from mempool:', error)
    return []
  }
}
