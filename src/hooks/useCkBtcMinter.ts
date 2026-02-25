import { HttpAgent } from '@icp-sdk/core/agent'
import { Principal } from '@icp-sdk/core/principal'

import { convertVolumeFromCanister } from '../utils/calculationsUtils'
import { getActorCkBtcMinter } from '../utils/canisterCkBtcMinterUtils'
import { getAuctionCanisterId } from '../utils/canisterUtils'
import {
  hexToUint8Array,
  getSubAccountFromPrincipal,
} from '../utils/convertionsUtils'

/**
 * Custom hook for fetching and managing known UTXOs from the ckBTC Minter.
 */
const useCkBtcMinter = () => {
  /**
   * Retrieves the list of known UTXOs from the ckBTC Minter.
   *
   * @param userAgent - Instance of HttpAgent used for authentication and requests.
   * @returns - A promise that resolves to the list of known UTXOs.
   */
  const getCkBtcMinter = async (
    userAgent: HttpAgent,
    userPrincipal: string,
    tokens: any[],
  ): Promise<any> => {
    try {
      // Initialize the ckBTC Minter service actor
      const serviceActor = getActorCkBtcMinter(userAgent)

      const canisterId = getAuctionCanisterId()

      const owner = Principal.fromText(canisterId)
      const hexSubAccountId =
        getSubAccountFromPrincipal(userPrincipal).subAccountId
      const subaccount = new Uint8Array(hexToUint8Array(hexSubAccountId))

      // Fetch the known UTXOs from the minter
      const result = await serviceActor.get_known_utxos({
        owner: [owner],
        subaccount: [subaccount],
      })

      return result.map((utxo) => ({
        height: utxo.height,
        txid: Array.from(utxo.outpoint.txid)
          .reverse()
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join(''),
        amount: convertVolumeFromCanister(
          Number(utxo.value),
          tokens.find((t) => t.base === 'BTC')?.decimals || 8,
          0,
        ).volumeInBase,
      }))
    } catch (error) {
      console.error('Error fetching UTXOs from ckBTC Minter:', error)
      return []
    }
  }

  const ckBtcMinterUpdateBalance = async (
    userAgent: HttpAgent,
    userPrincipal: string,
  ): Promise<any> => {
    try {
      // Initialize the ckBTC Minter service actor
      const serviceActor = getActorCkBtcMinter(userAgent)

      const canisterId = getAuctionCanisterId()

      const owner = Principal.fromText(canisterId)
      const hexSubAccountId =
        getSubAccountFromPrincipal(userPrincipal).subAccountId
      const subaccount = new Uint8Array(hexToUint8Array(hexSubAccountId))

      // Fetch the known UTXOs from the minter
      const result = await serviceActor.update_balance({
        owner: [owner],
        subaccount: [subaccount],
      })

      return result
    } catch (error) {
      console.error('Error fetching Update Balance from ckBTC Minter:', error)
      return []
    }
  }

  return { getCkBtcMinter, ckBtcMinterUpdateBalance }
}

export default useCkBtcMinter
