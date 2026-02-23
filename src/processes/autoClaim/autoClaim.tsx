import { Principal } from '@dfinity/principal'
import { useWallet as useWalletPackage } from 'icrc84-package'
import { useSelector, useDispatch } from 'react-redux'

import { idlFactory as Icrc84IDLFactory } from '../../../declarations/icrc1_auction/icrc1_auction.did'
import useAuctionQuery from '../../hooks/useAuctionQuery'
import { RootState, AppDispatch } from '../../store'
import { setBalances } from '../../store/balances'
import { ClaimTokenBalance, TokenDataItem } from '../../types'
import { getToken } from '../../utils/tokenUtils'

export const useHandleAllTrackedDeposits = () => {
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const tokens = useSelector((state: RootState) => state.tokens.tokens)
  const canisterId = `${process.env.CANISTER_ID_ICRC_AUCTION}`

  const { getTrackedDeposit, getBalance, balanceNotify } = useWalletPackage(
    userAgent,
    canisterId,
    Icrc84IDLFactory,
  )
  const dispatch = useDispatch<AppDispatch>()

  const fetchBalances = async () => {
    const { getQuerys } = useAuctionQuery()
    const { credits: balancesCredits = [] } = await getQuerys(userAgent, {
      tokens: tokens,
      queryTypes: ['credits'],
    })

    dispatch(setBalances(balancesCredits))
    return balancesCredits
  }

  const handleNotify = async (principal: string | undefined) => {
    await balanceNotify(principal)
  }

  const handleAllTrackedDeposits = async (userPrincipal: string) => {
    const balances = await fetchBalances()

    const trackedDeposit = await getTrackedDeposit(tokens, '')

    const tokensBalance: ClaimTokenBalance[] = []
    await Promise.all(
      balances.map(async (token: TokenDataItem) => {
        const balanceOf = await getBalance(
          [token],
          `${token.principal}`,
          userPrincipal,
          'claim',
        )

        const tokenDeposit =
          trackedDeposit.find(
            (item: { token: { base: string } }) =>
              item.token.base === token.base,
          ) || null

        const deposit = tokenDeposit ? tokenDeposit.volumeInBase : 0

        if (
          typeof balanceOf === 'number' &&
          typeof deposit === 'number' &&
          !isNaN(balanceOf) &&
          !isNaN(deposit)
        ) {
          const available = balanceOf - deposit
          if (available > 0) {
            tokensBalance.push({
              principal: `${token?.principal}`,
              base: token?.base,
              available,
            })
          }
        }
      }),
    )

    if (tokensBalance.length > 0) {
      await Promise.all(
        tokensBalance.map(async (token) => {
          const tokenInfo = getToken(
            tokens,
            Principal.fromText(token.principal),
          )

          if (token.available >= Number(tokenInfo.fee)) {
            await handleNotify(token.principal)
          }
        }),
      )

      await fetchBalances()
    }

    return tokensBalance
  }

  return { handleAllTrackedDeposits }
}
