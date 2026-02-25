import { Actor, ActorSubclass, HttpAgent } from '@icp-sdk/core/agent'

import { _SERVICE as Icrc84Actor } from '../../declarations/ckBtcMinter/ckBtcMinter.did'
import { idlFactory as Icrc84IDLFactory } from '../../declarations/ckBtcMinter/ckBtcMinter.did'

let actorCache: ActorSubclass<Icrc84Actor> | null = null
let userAgentCache: HttpAgent | null = null

/**
 * Creates and returns an actor for interacting with the ckBtc Minter canister.
 * Ensures that the actor is only recreated if the userAgent changes.
 * @param userAgent - The HTTP agent to be used for creating the actor.
 * @returns The created service actor.
 */
export function getActorCkBtcMinter(
  userAgent: HttpAgent,
): ActorSubclass<Icrc84Actor> {
  if (!actorCache || userAgentCache !== userAgent) {
    userAgentCache = userAgent

    actorCache = Actor.createActor<Icrc84Actor>(Icrc84IDLFactory, {
      agent: userAgent,
      canisterId: `${process.env.CANISTER_ID_CKBTC_MINTER}`,
    })
  }

  return actorCache
}
