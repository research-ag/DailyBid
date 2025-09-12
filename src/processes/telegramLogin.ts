import { useEffect } from 'react'

import {
  DelegationChain,
  DelegationIdentity,
  Ed25519KeyIdentity,
} from '@dfinity/identity'
import { useDispatch } from 'react-redux'

import useDPasteApi from '../hooks/useDpasteApi'
import useWindow from '../hooks/useWindow'
import { AppDispatch } from '../store'
import { getAgent, doLogin } from '../utils/authUtils'
import {
  mnemonicAuthenticate,
  retrieveStoredDelegationII,
} from '../utils/authUtils'
import { decrypt } from '../utils/cryptoUtils'

const TelegramLoginComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  const { getIsTelegramApp } = useWindow()
  const { isTelegram } = getIsTelegramApp()

  const { readPrivateSnippetFromDpaste } = useDPasteApi()

  // Telegram mini app - Automatic login mnemonic
  const processMnemonic = async (mnemonicPhrase: string) => {
    try {
      const sanitizePhrase = (phrase: string): string[] =>
        phrase.split(' ').filter((chunk) => chunk.trim() !== '')

      const sanitizedPhrase = sanitizePhrase(mnemonicPhrase)
      await mnemonicAuthenticate(sanitizedPhrase, dispatch)
    } catch (error) {
      console.error('Automatic authentication failed.')
    }
  }

  type DelegationChain = {
    delegations: any[]
  }

  const updateDelegations = (
    data: DelegationChain,
    newDelegation: any[],
  ): DelegationChain => {
    return {
      ...data,
      delegations: [...data.delegations, ...newDelegation],
    }
  }

  // Telegram mini app - Internet Identity delegation login
  const processDelegation = async (
    delegationCode: string,
    aesKey: string,
    obj: any,
  ) => {
    const delegationJSON = await readPrivateSnippetFromDpaste(delegationCode)

    const genAesKeyUint8Array = new Uint8Array(Buffer.from(aesKey, 'hex'))

    const delegationDecrypted = decrypt(delegationJSON, genAesKeyUint8Array)

    const del = JSON.parse(delegationDecrypted)

    const newDelegation = {
      delegation: {
        expiration: obj.expiration,
        pubkey: obj.pubkey,
      },
      signature: obj.signature,
    }

    const updatedDelegation = updateDelegations(del, [newDelegation])
    console.log('updatedDelegation', updatedDelegation)

    if (delegationDecrypted) {
      try {
        const delegationChain = DelegationChain.fromJSON(
          JSON.parse(delegationDecrypted),
        )

        const identityJSON = localStorage.getItem('identity')
        const identity = identityJSON
          ? Ed25519KeyIdentity.fromJSON(identityJSON)
          : null
        console.log('identity', identity)
        if (identity) {
          const publicKey = Buffer.from(
            identity.getPublicKey().toDer(),
          ).toString('hex')

          const delegationChainPublicKey = Buffer.from(
            delegationChain.delegations[1].delegation.pubkey,
          ).toString('hex')

          console.log('delegationChainPublicKey', delegationChainPublicKey)

          if (publicKey === delegationChainPublicKey) {
            const delegationIdentity = DelegationIdentity.fromDelegation(
              identity,
              delegationChain,
            )

            console.log('delegationIdentity', delegationIdentity)

            // Stores delegation and identity keys as hex-encoded strings for secure storage or transmission.
            const delegationData = {
              delegationChain: delegationChain.toJSON(),
              identity: {
                publicKey: Buffer.from(
                  identity.getPublicKey().toDer(),
                ).toString('hex'),
                secretKey: Buffer.from(
                  JSON.stringify(identity.toJSON()),
                ).toString('hex'),
              },
            }

            console.log('delegationData', delegationData)

            localStorage.setItem(
              'delegationIdentity',
              JSON.stringify(delegationData),
            )

            const agent = getAgent(delegationIdentity)
            console.log('agent', agent)

            doLogin(agent, dispatch, 'IC')
          }
        }
      } catch (error) {
        console.error('Failed to process delegation:', error)
      }
    } else {
      console.warn('Delegation parameter not found in the URL.')
    }
  }

  useEffect(() => {
    const processLogin = async () => {
      const restoredDelegationII = retrieveStoredDelegationII()
      const urlParams = new URL(window.location.href)

      const queryString = urlParams.searchParams.get('tgWebAppStartParam') || ''
      //const queryString = urlParams.searchParams.get('startapp') || ''

      const [delegationCode, keyValue, expiration, pubkey, signature] =
        queryString.split('_')

      const aesKey = keyValue?.startsWith('key-') ? keyValue.split('-')[1] : ''

      const obj = {
        expiration,
        pubkey,
        signature,
      }
      console.log('queryString', queryString)
      console.log('delegationCode', delegationCode)
      console.log('aesKey', aesKey)
      console.log('expiration', expiration)
      console.log('pubkey', pubkey)
      console.log('signature', signature)

      if (isTelegram) {
        //} || delegationCode) {
        if (delegationCode) {
          processDelegation(delegationCode, aesKey, obj)
        } else if (restoredDelegationII) {
          const agent = getAgent(restoredDelegationII)
          doLogin(agent, dispatch, 'IC')
        } else {
          const localStorageSaved = localStorage.getItem('mnemonicPhrase')
          if (localStorageSaved) {
            const seed = decrypt(localStorageSaved)
            processMnemonic(seed)
          }
        }
      }
    }

    processLogin()
  }, [isTelegram])
  //}, [])

  return null
}
export default TelegramLoginComponent
