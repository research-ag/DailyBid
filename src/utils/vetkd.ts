import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import {
  DerivedKeyMaterial,
  DerivedPublicKey,
  EncryptedVetKey,
  TransportSecretKey,
  IbeCiphertext,
  IbeIdentity,
  IbeSeed,
} from '@dfinity/vetkeys'

const AES_GCM_DOMAIN = 'icrc1-auction-aes-gcm'

export const CRYPTO_CANISTER_ID = process.env.CANISTER_ID_CRYPTO
const cryptoIdlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  return IDL.Service({
    get_ibe_public_key: IDL.Func([], [IDL.Vec(IDL.Nat8)], []),
    encrypted_symmetric_key_for_user: IDL.Func(
      [IDL.Vec(IDL.Nat8)],
      [IDL.Vec(IDL.Nat8)],
      [],
    ),
  })
}

function createCryptoActor(agent: HttpAgent) {
  return Actor.createActor(cryptoIdlFactory, {
    agent,
    canisterId: CRYPTO_CANISTER_ID!,
  }) as unknown as {
    get_ibe_public_key: () => Promise<Uint8Array | number[]>
    encrypted_symmetric_key_for_user: (
      tpk: Uint8Array,
    ) => Promise<Uint8Array | number[]>
  }
}

const kmCache = new Map<string, Promise<DerivedKeyMaterial>>()

async function getDerivedKeyMaterial(
  agent: HttpAgent,
): Promise<DerivedKeyMaterial | null> {
  const principal = await agent.getPrincipal()
  const principalText = principal.toText()

  if (!CRYPTO_CANISTER_ID) return null

  if (!kmCache.has(principalText)) {
    const promise = (async () => {
      const crypto = createCryptoActor(agent)

      const dpkBytes = new Uint8Array(await crypto.get_ibe_public_key())
      const dpk = DerivedPublicKey.deserialize(dpkBytes)

      const tsk = TransportSecretKey.random()
      const tpk = tsk.publicKeyBytes()

      const enc = new Uint8Array(
        await crypto.encrypted_symmetric_key_for_user(tpk),
      )
      const encrypted = EncryptedVetKey.deserialize(enc)
      const input = (principal as any).toUint8Array()
      const vetKey = encrypted.decryptAndVerify(tsk, dpk, input)

      return await vetKey.asDerivedKeyMaterial()
    })()
    kmCache.set(principalText, promise)
    promise.catch(() => kmCache.delete(principalText))
  }

  return kmCache.get(principalText)!
}

export async function encryptWithVetKD(
  agent: HttpAgent,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const km = await getDerivedKeyMaterial(agent)
  if (!km) {
    throw new Error('VetKD encryption unavailable: no derived key material.')
  }
  return km.encryptMessage(plaintext, AES_GCM_DOMAIN)
}

export async function decryptWithVetKD(
  agent: HttpAgent,
  ciphertext: Uint8Array,
): Promise<Uint8Array | null> {
  const km = await getDerivedKeyMaterial(agent)
  if (!km) return null
  try {
    return await km.decryptMessage(ciphertext, AES_GCM_DOMAIN)
  } catch (e) {
    console.warn("Can't decrypt with VetKD: invalid ciphertext.", e)
    return null
  }
}

export async function encryptWithIBE(
  agent: HttpAgent,
  plaintext: Uint8Array,
  nextSessionTimestamp: number,
): Promise<Uint8Array> {
  if (!CRYPTO_CANISTER_ID) {
    throw new Error('CRYPTO_CANISTER_ID is not configured')
  }
  const crypto = createCryptoActor(agent)
  const dpkBytes = new Uint8Array(await crypto.get_ibe_public_key())
  const publicKey = DerivedPublicKey.deserialize(dpkBytes)

  const ciphertext = IbeCiphertext.encrypt(
    publicKey,
    IbeIdentity.fromBytes(
      new TextEncoder().encode(nextSessionTimestamp.toString()),
    ),
    plaintext,
    IbeSeed.random(),
  )
  return ciphertext.serialize()
}
