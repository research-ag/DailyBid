import { Buffer } from 'buffer'

import { AccountIdentifier, SubAccount } from '@icp-sdk/canisters/ledger/icp'
import {
  encodeIcrcAccount,
  decodeIcrcAccount,
} from '@icp-sdk/canisters/ledger/icrc'
import { Principal } from '@icp-sdk/core/principal'
import bigInt from 'big-integer'

import { getAuctionCanisterId } from './canisterUtils'

/**
 * Converts a hexadecimal string to a big integer.
 * @param hexFormat - The hexadecimal string in the format '0x...'.
 * @returns A big integer representation of the hexadecimal number or undefined if invalid.
 */
const hexToNumber = (hexFormat: string) => {
  if (!hexFormat.startsWith('0x')) return undefined
  const hex = hexFormat.slice(2)
  if (!/^[a-fA-F0-9]+$/.test(hex)) return undefined

  let number = bigInt(0)
  for (let index = 0; index < hex.length; index++) {
    const digit = hex[hex.length - index - 1]
    const value = bigInt(parseInt(digit, 16))
    number = number.add(value.multiply(bigInt(16).pow(index)))
  }

  return number
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 * @param hex - The hexadecimal string in the format '0x...'.
 * @returns A Uint8Array of 32 bytes representing the hexadecimal number.
 */
export const hexToUint8Array = (hex: string): Uint8Array => {
  const bigNumber = hexToNumber(hex)
  if (!bigNumber) return new Uint8Array(32)

  const result = new Uint8Array(32)
  const n256 = bigInt(256)
  let tempNumber = bigNumber
  let i = 0

  while (tempNumber.greater(0)) {
    result[31 - i] = tempNumber.mod(n256).toJSNumber()
    tempNumber = tempNumber.divide(n256)
    i++
  }

  return result
}

/**
 * Converts a hexadecimal string into a Uint8Array.
 * This function takes a valid hexadecimal string and converts it into a Uint8Array representation.
 * It ensures that the input is a string, trims any extra spaces, and validates that the length is even.
 * @param hexString - The hexadecimal string to convert.
 * @returns - A Uint8Array representing the binary data of the given hexadecimal string.
 * @throws - Throws an error if the input is not a string, has an odd length, or contains invalid characters.
 */
export function hexToByteArray(hexString: string): Uint8Array {
  if (typeof hexString !== 'string') {
    throw new Error('Invalid hex string: input is not a string')
  }

  const cleanedHexString = hexString.trim()
  if (cleanedHexString.length % 2 !== 0) {
    throw new Error('Invalid hex string: must have an even length')
  }

  const byteArray = new Uint8Array(cleanedHexString.length / 2)

  for (let i = 0; i < cleanedHexString.length; i += 2) {
    const byte = parseInt(cleanedHexString.slice(i, i + 2), 16)
    if (isNaN(byte)) {
      throw new Error(
        `Invalid byte sequence at position ${i}: ${cleanedHexString.slice(i, i + 2)}`,
      )
    }
    byteArray[i / 2] = byte
  }

  return byteArray
}

/**
 * Converts a Principal string into an account object with subaccount information.
 * @param principal - The string representation of the Principal.
 * @returns An object containing the subaccount as a hexadecimal string and the subAccountId in `0x` prefixed format.
 */
export function getSubAccountFromPrincipal(principal: string) {
  const principalBytes = Principal.fromText(principal).toUint8Array()
  const lengthHex = principalBytes.length.toString(16).padStart(2, '0')
  const hex = Buffer.from(principalBytes).toString('hex')

  return {
    subaccount: lengthHex + hex,
    subAccountId: `0x${lengthHex + hex}`,
  }
}

/**
 * Converts a hexadecimal string into a 32-byte array of decimal values (0-255).
 * Ensures the result is always 32 bytes, left-padded with 0s if necessary.
 * @param hex - The hexadecimal string to convert.
 * @returns - A string of 32 decimal values separated by `;`.
 */
export function convertHexSubAccountToDecimals(hex: string): string {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2) // Remove "0x" prefix if present
  }

  // Ensure the hex string length is even
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters')
  }

  // Convert hex to byte array
  const decimalArray: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    decimalArray.push(parseInt(hex.substring(i, i + 2), 16))
  }

  // Ensure result is always 32 bytes, left-padding with 0s if necessary
  while (decimalArray.length < 32) {
    decimalArray.unshift(0)
  }

  // Return as a semicolon-separated string
  return decimalArray.join(';')
}

/**
 * Converts a Principal string into a deposit account information.
 * @param principal - The string representation of the Principal.
 * @returns An object containing the deposit account string.
 */
export function getUserDepositAddress(principal: string) {
  const hexSubAccountId = getSubAccountFromPrincipal(principal).subAccountId

  const subAccountUint8Array = new Uint8Array(hexToUint8Array(hexSubAccountId))

  const auctionCanisterId = getAuctionCanisterId()

  const depositAccount = encodeIcrcAccount({
    owner: Principal.fromText(auctionCanisterId),
    subaccount: subAccountUint8Array,
  })

  return depositAccount
}

/**
 * Generates an account identifier in hexadecimal format from a given principal and subaccount.
 * If the subaccount is invalid, it defaults to `undefined`.
 * @param principal - The principal identifier in string format.
 * @param subaccount - A hexadecimal string representing the subaccount.
 * @returns - The account identifier in hexadecimal format (ICP Legacy).
 *
 * @throws - If the `subaccount` is not a valid hexadecimal string, it defaults to `undefined`.
 */
export const getAccountIdentifier = (principal: string, subaccount: string) => {
  let subacc: SubAccount | undefined = undefined

  try {
    subacc = SubAccount.fromBytes(hexToUint8Array(subaccount)) as SubAccount
  } catch (error) {
    subacc = undefined
  }

  return AccountIdentifier.fromPrincipal({
    principal: Principal.fromText(principal),
    subAccount: subacc,
  }).toHex()
}

/**
 * Decodes an ICRC account string into its parsed representation. Is used to verify ICRC addresses.
 * @param account - The ICRC account string to decode.
 * @returns - Returns the decoded account object if successful, or `undefined` if the decoding fails.
 */
export const decodeIcrcAccountText = (account: string) => {
  try {
    return decodeIcrcAccount(account)
  } catch {
    return undefined
  }
}

/**
 * Truncates a number to the specified number of decimal places without rounding.
 *
 * @param num - The number to be truncated.
 * @param decimalPlaces - The number of decimal places to keep.
 * @returns The truncated number as a string with the specified number of decimal places.
 */
export function toFixedWithoutRounding(num: number, decimalPlaces: number) {
  const numStr = num.toString()
  const decimalIndex = numStr.indexOf('.')

  if (decimalIndex === -1) {
    return numStr + '.' + '0'.repeat(decimalPlaces)
  }

  const desiredLength = decimalIndex + decimalPlaces + 1

  if (numStr.length <= desiredLength) {
    return numStr
  }

  return numStr.slice(0, desiredLength)
}
