import { HttpAgent, Identity } from '@dfinity/agent'
import { AuthClient } from '@dfinity/auth-client'
import {
  Ed25519KeyIdentity,
  DelegationChain,
  DelegationIdentity,
  isDelegationValid,
} from '@dfinity/identity'
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1'

import {
  getUserDepositAddress,
  getAccountIdentifier,
  getSubAccountFromPrincipal,
} from './convertionsUtils'
import { AppDispatch } from '../store'
import {
  getInternetIdentityDerivationOrigin,
  getAuctionCanisterId,
} from './canisterUtils'
import {
  generateBtcDepositAddress,
  depositCyclesCommandString,
} from './walletUtils'
import {
  setUserAgent,
  setIsAuthenticated,
  setUserPrincipal,
  setUserDeposit,
  setUserBtcDepositAddress,
  setUserIcpLegacyAccount,
  setUserDepositCycles,
} from '../store/auth'
import { getDeviceType } from '../utils/deviceUtils'
import { getLocation } from '../utils/locationUtils'
import { analytics } from '../utils/mixpanelUtils'

/**
 * Creates and returns an HTTP agent with the specified identity.
 * @param identity - The identity to be used for the agent.
 * @returns The created HTTP agent.
 */
export function getAgent(identity: Identity) {
  const HTTP_AGENT_HOST = `${process.env.HTTP_AGENT_HOST}`

  const myAgent = HttpAgent.createSync({
    identity,
    host: HTTP_AGENT_HOST,
    retryTimes: 10,
  })

  return myAgent
}

/**
 * Checks if the provided `HttpAgent` is authenticated using Internet Identity (Login II)
 * and whether the delegation is still valid.
 * @param userAgent - The HttpAgent instance to check.
 * @returns - Returns `true` if authenticated with a valid delegation or another method,
 *                    `false` if the delegation has expired.
 */
export const checkUserAgentDelegation = (userAgent: HttpAgent): boolean => {
  try {
    // Retrieve the identity from the HttpAgent
    const identity = (userAgent as any).config?.identity

    // If no identity exists, assume authentication was done through another method
    if (!identity) {
      return true // Authenticated with another method (e.g., Seed, Mnemonic, NFID, etc.)
    }

    // Check if the identity is a DelegationIdentity (indicating Login II authentication)
    if (identity instanceof DelegationIdentity) {
      const delegationChain = identity.getDelegation()

      // Validate the delegation
      if (isDelegationValid(delegationChain)) {
        return true // Valid delegation
      } else {
        return false // Expired delegation
      }
    }

    return true // Authenticated with another method
  } catch (error) {
    console.error('Error checking delegation:', error)
    return false
  }
}

/**
 * Generates a new Ed25519 key pair and extracts the public key.
 * This function creates a new Ed25519 key pair, retrieves the public key in DER format,
 * and converts it into a hexadecimal string.
 * @returns - An object containing:
 *  - `identity`: The generated `Ed25519KeyIdentity` instance.
 *  - `publicKey`: The extracted public key as a hexadecimal string.
 */
export function generatePublicKey() {
  const identity = Ed25519KeyIdentity.generate()
  const publicKeyDer = identity.getPublicKey().toDer()
  const publicKey = Buffer.from(publicKeyDer).toString('hex')

  return { identity, publicKey }
}

/**
 * Performs the login process by dispatching actions to set the user agent and authentication status.
 * @param myAgent - The HTTP agent to be used for the login process.
 * @param dispatch - The dispatch function to trigger actions in the Redux store.
 */

export async function doLogin(
  myAgent: HttpAgent,
  dispatch: AppDispatch,
  loginMethod: string,
) {
  const canisterId = getAuctionCanisterId()

  const principal = await myAgent.getPrincipal()
  const principalText = principal.toText()

  const hexSubAccountId = getSubAccountFromPrincipal(principalText).subAccountId

  const userIcpLegacyAccount = getAccountIdentifier(
    `${canisterId}`,
    `${hexSubAccountId}`,
  )

  const depositCyclescommandText = depositCyclesCommandString(
    canisterId,
    principalText,
    hexSubAccountId,
  )

  // Mixpanel event tracking [User Identify]
  analytics.userIdentify(principalText)

  // Mixpanel event tracking [User Logged In]
  analytics.userLoggedIn({
    principal: principalText,
    login_method: loginMethod,
  })

  // Mixpanel event tracking [Demographics Captured]
  analytics.demographicsCaptured({
    principal: principalText,
    location: await getLocation(),
    device_type: getDeviceType(),
  })

  dispatch(setUserAgent(myAgent))
  dispatch(setIsAuthenticated(true))
  dispatch(setUserPrincipal(principalText))
  dispatch(setUserDeposit(getUserDepositAddress(principalText)))
  dispatch(setUserBtcDepositAddress(generateBtcDepositAddress(principalText)))
  dispatch(setUserIcpLegacyAccount(userIcpLegacyAccount))
  dispatch(setUserDepositCycles(depositCyclescommandText))
}

/**
 * Authenticates the user using a seed phrase and dispatches actions to set the user agent and authentication status.
 * @param seed - The seed phrase to generate the identity.
 * @param dispatch - The dispatch function to trigger actions in the Redux store.
 */
export async function seedAuthenticate(seed: string, dispatch: AppDispatch) {
  try {
    if (seed.length === 0 || seed.length > 32) return

    const seedToIdentity: (seed: string) => Identity | null = (seed) => {
      const seedBuf = new Uint8Array(new ArrayBuffer(32))
      seedBuf.set(new TextEncoder().encode(seed))
      return Ed25519KeyIdentity.generate(seedBuf)
    }

    const newIdentity = seedToIdentity(seed)

    if (newIdentity) {
      const myAgent = getAgent(newIdentity)
      await doLogin(myAgent, dispatch, 'Seed')
    }
  } catch (error) {
    console.error('Error during seed authentication:', error)
  }
}

/**
 * Authenticates the user using an internet identity or another authentication network and dispatches actions
 * to set the user agent and authentication status.
 * @param dispatch - The dispatch function to trigger actions in the Redux store.
 * @param AuthNetworkTypes - The authentication network type to use, either 'IC' (Internet Computer) or 'NFID'.
 */
export async function identityAuthenticate(
  dispatch: AppDispatch,
  AuthNetworkTypes: 'IC' | 'NFID',
): Promise<void> {
  try {
    const authClient = await AuthClient.create()
    const HTTP_AGENT_HOST =
      AuthNetworkTypes === 'IC'
        ? `${process.env.HTTP_AGENT_HOST}`
        : `${process.env.HTTP_AGENT_HOST_NFID}`

    const selectedTime = localStorage.getItem(
      'selectedTimeLoginDurationInterval',
    )
    const expirationHours = selectedTime ? parseFloat(selectedTime) : 0.5

    const AUTH_EXPIRATION_INTERNET_IDENTITY = BigInt(
      expirationHours * 60 * 60 * 1000 * 1000 * 1000,
    )

    let windowFeatures = undefined
    const isDesktop = window.innerWidth > 768
    if (isDesktop) {
      const width = 500
      const height = 600
      const left = window.screenX + (window.innerWidth - width) / 2
      const top = window.screenY + (window.innerHeight - height) / 2
      windowFeatures = `left=${left},top=${top},width=${width},height=${height}`
    }

    await authClient.login({
      maxTimeToLive: AUTH_EXPIRATION_INTERNET_IDENTITY,
      identityProvider: HTTP_AGENT_HOST,
      derivationOrigin: getInternetIdentityDerivationOrigin(),
      windowOpenerFeatures: windowFeatures,
      onSuccess: async () => {
        const identity = authClient.getIdentity()
        const myAgent = getAgent(identity)
        await doLogin(myAgent, dispatch, AuthNetworkTypes)
      },
      onError: (error) => {
        AuthNetworkTypes === 'IC'
          ? console.error('Internet Identity authentication failed', error)
          : console.error('NFID authentication failed', error)
      },
    })
  } catch (error) {
    console.error('Unexpected error during authentication process', error)
  }
}

/**
 * Checks if the user is authenticated with Internet Identity (II) stored in indexedDB in a web browser.
 * It initializes an `AuthClient` and verifies if an active session exists.
 * @returns The authenticated identity if available, otherwise `false`.
 */
export const validateLoginIIBrowser = async () => {
  const authClient = await AuthClient.create({
    idleOptions: {
      disableIdle: true,
    },
  })

  const isAuthenticated = await authClient.isAuthenticated()
  if (isAuthenticated) {
    return authClient.getIdentity()
  } else return false
}

/**
 * Retrieves a stored Internet Identity delegation from `localStorage`.
 * It reconstructs the `DelegationIdentity` using the stored identity secret key and delegation chain.
 * @returns The reconstructed `DelegationIdentity` if valid, otherwise `false`.
 */
export const retrieveStoredDelegationII = () => {
  const storedData = localStorage.getItem('delegationIdentity')

  if (storedData) {
    const parsedData = JSON.parse(storedData)

    const identity = Ed25519KeyIdentity.fromJSON(
      Buffer.from(parsedData.identity.secretKey, 'hex').toString(),
    )

    const delegationChain = DelegationChain.fromJSON(parsedData.delegationChain)

    const isValid = isDelegationValid(delegationChain)
    if (!isValid) return false

    const delegationIdentity = DelegationIdentity.fromDelegation(
      identity,
      delegationChain,
    )

    return delegationIdentity
  }

  return false
}

/**
 * Authenticates a user using a mnemonic seed phrase.
 * @param phrase - An array of words representing the mnemonic seed phrase.
 * @param dispatch - The dispatch function to trigger actions in the Redux store.
 */
export const mnemonicAuthenticate = async (
  phrase: string[],
  dispatch: AppDispatch,
): Promise<void> => {
  try {
    const createIdentity = (seedPhrase: string[]): Identity | null => {
      try {
        return Secp256k1KeyIdentity.fromSeedPhrase(seedPhrase) as Identity
      } catch (error) {
        console.error('Error creating identity from seed phrase:', error)
        return null
      }
    }

    const newIdentity = createIdentity(phrase)

    if (!newIdentity) {
      throw new Error(
        'Failed to generate identity from the provided seed phrase.',
      )
    }

    const myAgent = getAgent(newIdentity)

    await doLogin(myAgent, dispatch, 'Mnemonic')
  } catch (error) {
    console.error('Authentication failed:', error)
  }
}
