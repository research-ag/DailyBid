import React, { useState, useEffect, useCallback } from 'react'

import {
  Flex,
  Button,
  Icon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast,
  useColorModeValue,
  useColorMode,
  Tooltip,
  Image,
  useClipboard,
} from '@chakra-ui/react'
import { Principal } from '@dfinity/principal'
import { useTranslation } from 'react-i18next'
import { FaBitcoin } from 'react-icons/fa'
import { useSelector, useDispatch } from 'react-redux'

import ActionTab from './actions/actionTab'
import LedgerTab from './ledger/ledgerTab'
import TokenTab from './tokens/tokenTab'
import Cycles from '../../../assets/img/coins/cycles.svg'
import IcpMonoIcon from '../../../assets/img/coins/icp_mono.svg'
import WalletIconDark from '../../../assets/img/common/wallet-black.svg'
import WalletIconLight from '../../../assets/img/common/wallet-white.svg'
import useAuctionQuery from '../../../hooks/useAuctionQuery'
import useWallet from '../../../hooks/useWallet'
import { RootState, AppDispatch } from '../../../store'
import { setActions } from '../../../store/actions'
import { setUserPoints } from '../../../store/auth'
import { setBalances, setIsWithdrawStarted } from '../../../store/balances'
import {
  Result,
  TokenDataItem,
  TokenMetadata,
  ClaimTokenBalance,
} from '../../../types'
import {
  convertVolumeFromCanister,
  convertVolumetoCanister,
  getDecimals,
  fixDecimal,
} from '../../../utils/calculationsUtils'
import { analytics } from '../../../utils/mixpanelUtils'
import { getToken } from '../../../utils/tokenUtils'
import {
  getSimpleToastDescription,
  getDoubleLineToastDescription,
} from '../../../utils/uiUtils'
import { formatWalletAddress } from '../../../utils/walletUtils'
import {
  getErrorMessageNotifyDeposits,
  getErrorMessageWithdraw,
  getErrorMessageDeposit,
  getErrorMessageBtcWithdraw,
  getErrorMessageCyclesWithdraw,
  getMemPoolUtxos,
} from '../../../utils/walletUtils'
import QrCodeModal from '../../qrCodeModal'

const WalletContent: React.FC = () => {
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const borderColor = useColorModeValue('grey.700', 'grey.25')
  const { colorMode } = useColorMode()
  const { t } = useTranslation()
  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })
  const dispatch = useDispatch<AppDispatch>()
  const [selectedTab, setSelectedTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isQrModalOpenBtc, setIsQrModalOpenBtc] = useState(false)
  const [isQrModalOpenIcrc1, setIsQrModalOpenIcrc1] = useState(false)
  const [isQrModalOpenIcpLegacy, setIsQrModalOpenIcpLegacy] = useState(false)
  const [depositCyclesConfirmation, setDepositCyclesConfirmation] =
    useState(false)
  const [localBalances, setLocalBalances] = useState<TokenDataItem[]>([])
  const [claimTokensBalance, setClaimTokensBalance] = useState<
    ClaimTokenBalance[]
  >([])
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )
  const userPrincipal = useSelector(
    (state: RootState) => state.auth.userPrincipal,
  )
  const userBtcDeposit = useSelector(
    (state: RootState) => state.auth.userBtcDepositAddress,
  )
  const userIcpLegacyAccount = useSelector(
    (state: RootState) => state.auth.userIcpLegacyAccount,
  )
  const userDepositCycles = useSelector(
    (state: RootState) => state.auth.userDepositCycles,
  )

  const userDeposit = useSelector((state: RootState) => state.auth.userDeposit)
  const balances = useSelector((state: RootState) => state.balances.balances)
  const tokens = useSelector((state: RootState) => state.tokens.tokens)

  const userDepositAddress = formatWalletAddress(userDeposit)
  const userBtcDepositAddress = formatWalletAddress(userBtcDeposit)
  const userIcpLegacyAccountAddress = formatWalletAddress(userIcpLegacyAccount)

  const { onCopy: onCopyUserDeposit } = useClipboard(userDeposit)
  const { onCopy: onCopyBtcAddress } = useClipboard(userBtcDeposit)
  const { onCopy: onCopyIcpLegacyAddress } = useClipboard(userIcpLegacyAccount)
  const { onCopy: onCopyUserDepositCycles } = useClipboard(userDepositCycles)

  const userDepositTooltip = (
    <>
      {t(`ICRC-1 Tokens. Transfer here or set as allowance spender:`)}
      <br />
      {userDeposit}
    </>
  )

  const userBtcDepositAddressTooltip = (
    <>
      {t(`Bitcoin. Transfer here:`)}
      <br />
      {userBtcDeposit}
    </>
  )

  const userIcpLegacyAccountAddressTooltip = (
    <>
      {t(`ICP Legacy. Transfer here:`)}
      <br />
      {userIcpLegacyAccount}
    </>
  )

  const claimTooltipTextStandard = (
    <>
      {t(`Claim Direct Deposit`)}
      <br />
      {t(`Please wait...`)}
    </>
  )

  const [claimTooltipText, setClaimTooltipText] = useState(
    claimTooltipTextStandard,
  )

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    const { getQuerys } = useAuctionQuery()
    const {
      credits: balancesCredits = [],
      depositHistory: depositHistory = [],
      points,
    } = await getQuerys(userAgent, {
      tokens: tokens,
      queryTypes: ['credits', 'deposit_history'],
    })

    dispatch(setBalances(balancesCredits))
    dispatch(setActions(depositHistory))
    dispatch(setUserPoints(Number(points)))

    setLoading(false)
  }, [userAgent, tokens, dispatch])

  const copyToClipboardDepositAddress = () => {
    onCopyUserDeposit()
    toast({
      title: t('Copied'),
      description: t('Wallet account copied to clipboard'),
      status: 'success',
      duration: 2000,
    })
  }

  const copyToClipboardBtcDepositAddress = () => {
    onCopyBtcAddress()
    toast({
      title: t('Copied'),
      description: t('BTC account address copied to clipboard'),
      status: 'success',
      duration: 2000,
    })
  }

  const copyToClipboardIcpLegacyAccountAddress = () => {
    onCopyIcpLegacyAddress()
    toast({
      title: t('Copied'),
      description: t('ICP Legacy account address copied to clipboard'),
      status: 'success',
      duration: 2000,
    })
  }

  const copyToClipboardUserDepositCycles = () => {
    onCopyUserDepositCycles()
    toast({
      title: t('Copied'),
      description: t('Deposit cycles command copied to clipboard'),
      status: 'success',
      duration: 2000,
    })
  }

  const handleAllTrackedDeposits = useCallback(async () => {
    setClaimTooltipText(claimTooltipTextStandard)

    const { getTrackedDeposit, getBalance } = useWallet()

    const trackedDeposit = await getTrackedDeposit(userAgent, tokens, '')

    const tokensBalance: ClaimTokenBalance[] = []
    const claims = await Promise.all(
      balances.map(async (token) => {
        const balanceOf = await getBalance(
          userAgent,
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
            return `${fixDecimal(available, token.decimals)} ${token.base} ${t('available')}`
          }
        }
        return null
      }),
    )

    setClaimTokensBalance(tokensBalance)
    const filteredClaims = claims.filter((claim) => claim !== null)

    const ckBtcUtxo = JSON.parse(
      localStorage.getItem('ckBtcUtxo') || '[]',
      (key, value) =>
        typeof value === 'string' && /^\d+$/.test(value)
          ? BigInt(value)
          : value,
    )

    const newBtcUtxo = await getMemPoolUtxos(userBtcDeposit, ckBtcUtxo, tokens)
    console.log('newBtcUtxo list: ', newBtcUtxo)
    if (filteredClaims.length > 0 || newBtcUtxo.length > 0) {
      setClaimTooltipText(
        <>
          {filteredClaims.length > 0 ? (
            <>
              {t(`Claim Direct Deposits:`)}
              <br />
              {filteredClaims.map((claim, index) => (
                <div key={index}>{claim}</div>
              ))}
            </>
          ) : (
            <>
              {t(`Claim Direct Deposits:`)}
              <br />
              {t(`No direct deposits available`)}
            </>
          )}

          {newBtcUtxo.length > 0 && (
            <>
              <div
                style={{
                  width: '100%',
                  borderBottom: '1px solid',
                  margin: '8px 0',
                  textAlign: 'center',
                  borderColor: `${borderColor}`,
                }}
              ></div>
              {t(`Pending`)}:
              <br />
              {newBtcUtxo.map((utxo, index) => (
                <span key={index}>
                  <a
                    href={`https://mempool.space/tx/${utxo.txid}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      pointerEvents: 'all',
                    }}
                  >
                    {`${utxo.amount} BTC (${utxo.confirmations}/6)`}
                  </a>
                </span>
              ))}
            </>
          )}
        </>,
      )
    } else {
      setClaimTooltipText(
        <>
          {t(`Claim Direct Deposits:`)}
          <br />
          {t(`No deposits available`)}
        </>,
      )
    }
  }, [
    balances,
    userAgent,
    userPrincipal,
    userBtcDeposit,
    tokens,
    getMemPoolUtxos,
  ])

  const handleMultipleTokenClaims = useCallback(() => {
    claimTokensBalance.map((token) => {
      const tokenInfo = getToken(tokens, Principal.fromText(token.principal))

      if (token.available < Number(tokenInfo.fee)) {
        toast({
          title: t('The amount {{token}} detected is below the minimum', {
            token: token.base,
          }),
          description: '',
          status: 'warning',
          isClosable: true,
        })
      } else {
        handleNotify(token.principal, token.base)
      }
    })
  }, [claimTokensBalance])

  const handleNotify = useCallback(
    (principal: string | undefined, base: string) => {
      const startTime = Date.now()
      const { balanceNotify } = useWallet()

      const loadingNotify = (base: string, notifyLoading: boolean) => {
        setLocalBalances((prevBalances) =>
          prevBalances.map((balance: TokenDataItem) =>
            balance.base === base ? { ...balance, notifyLoading } : balance,
          ),
        )
      }
      loadingNotify(base, true)

      const toastId = toast({
        title: t('Checking new {{token}} deposits', { token: base }),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      balanceNotify(userAgent, principal)
        .then(async (response: Result) => {
          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          if (Object.keys(response).includes('Ok')) {
            await fetchBalances()
            const token = balances.find((balance) => balance.base === base)

            const creditTotalRaw = response.Ok?.credit
            const depositIncRaw = response.Ok?.deposit_inc
            const creditIncRaw = response.Ok?.credit_inc

            const { volumeInBase: creditTotal } = convertVolumeFromCanister(
              Number(creditTotalRaw),
              getDecimals(token),
              0,
            )

            const { volumeInBase: depositInc } = convertVolumeFromCanister(
              Number(depositIncRaw),
              getDecimals(token),
              0,
            )

            const { volumeInBase: creditInc } = convertVolumeFromCanister(
              Number(creditIncRaw),
              getDecimals(token),
              0,
            )

            if (toastId) {
              toast.update(toastId, {
                title: `${t('New {{token}} deposits found:', { token: base })} ${fixDecimal(depositInc, token?.decimals)}`,
                description: getSimpleToastDescription(
                  `${t('Credited:')} ${fixDecimal(creditInc, token?.decimals)} | ${t('Total')}: ${fixDecimal(creditTotal, token?.decimals)}`,
                  durationInSeconds,
                ),
                status: 'success',
                isClosable: true,
              })
            }

            // Mixpanel event tracking [Deposit Completed]
            analytics.depositCompleted({
              principal: userPrincipal,
              amount: `${fixDecimal(depositInc, token?.decimals)}`,
              currency: base,
              transaction_id: response.Ok?.txid,
              usd_value: '',
            })
          } else {
            if (toastId) {
              toast.update(toastId, {
                title: t('No new {{token}} deposits found', { token: base }),
                description: getSimpleToastDescription(
                  getErrorMessageNotifyDeposits(response.Err),
                  durationInSeconds,
                ),
                status: 'warning',
                isClosable: true,
              })
            }
          }
          loadingNotify(base, false)
        })
        .catch((error) => {
          const message = error.response ? error.response.data : error.message

          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          if (toastId) {
            toast.update(toastId, {
              title: t('Notify deposit rejected'),
              description: getSimpleToastDescription(
                `${t('Error')}: ${message}`,
                durationInSeconds,
              ),
              status: 'error',
              isClosable: true,
            })
          }
          loadingNotify(base, false)
          console.error('Cancellation failed:', message)
        })
    },
    [balances, fetchBalances, toast, userAgent],
  )

  const handleWithdraw = useCallback(
    (
      amount: number,
      account: string | undefined,
      token: TokenMetadata,
      network: string | null,
    ) => {
      const startTime = Date.now()

      const withdrawStatus = (base: string, withdrawStatus: string) => {
        setLocalBalances((prevBalances) =>
          prevBalances.map((balance: TokenDataItem) =>
            balance.base === base ? { ...balance, withdrawStatus } : balance,
          ),
        )
      }
      withdrawStatus(token.base, 'loading')

      const volume = convertVolumetoCanister(
        Number(amount),
        Number(token.decimals),
      )

      const toastId = toast({
        title: t(`Withdraw {{token}} pending`, { token: token.base }),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      if (network === 'cycles') {
        const { cyclesWithdrawCredit } = useWallet()
        cyclesWithdrawCredit(userAgent, `${account}`, Number(volume))
          .then((response: Result | null) => {
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            if (response && Object.keys(response).includes('Ok')) {
              fetchBalances()
              withdrawStatus(token.base, 'success')

              const { volumeInBase } = convertVolumeFromCanister(
                Number(response.Ok?.amount),
                Number(token.decimals),
                0,
              )

              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} Success`, { token: token.base }),
                  description: getSimpleToastDescription(
                    `${t('Amount')}: ${fixDecimal(volumeInBase, token.decimals)} | Txid: ${response.Ok?.txid}`,
                    durationInSeconds,
                  ),
                  status: 'success',
                  isClosable: true,
                })
              }

              // Mixpanel event tracking [Withdrawal Completed]
              analytics.withdrawalCompleted({
                principal: userPrincipal,
                amount: `${fixDecimal(volumeInBase, token.decimals)}`,
                currency: token.base,
                transaction_id: response.Ok?.txid,
              })
            } else if (response && Object.keys(response).includes('Err')) {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    getErrorMessageCyclesWithdraw(response.Err),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            } else {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    t('Something went wrong'),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            }
          })
          .catch((error) => {
            const message = error.response ? error.response.data : error.message
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            withdrawStatus(token.base, 'error')
            if (toastId) {
              toast.update(toastId, {
                title: t('Withdraw rejected'),
                description: getSimpleToastDescription(
                  `${t('Error')}: ${message}`,
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
            console.error('Withdraw failed:', message)
          })
      } else if (network === 'bitcoin') {
        const { btcWithdrawCredit } = useWallet()
        btcWithdrawCredit(userAgent, `${account}`, Number(volume))
          .then((response: Result | null) => {
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            if (response && Object.keys(response).includes('Ok')) {
              fetchBalances()
              withdrawStatus(token.base, 'success')

              console.log('btcWithdrawCreditResponse', response)

              const blockIndexStorage = JSON.parse(
                localStorage.getItem('blockIndex') || '[]',
                (key, value) =>
                  typeof value === 'string' && /^\d+$/.test(value)
                    ? BigInt(value)
                    : value,
              )

              const newBlockIndex = BigInt(response.Ok?.block_index)

              if (
                !Array.isArray(blockIndexStorage) ||
                blockIndexStorage.length === 0
              ) {
                localStorage.setItem(
                  'blockIndex',
                  JSON.stringify([newBlockIndex], (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value,
                  ),
                )
              } else {
                blockIndexStorage.push(newBlockIndex)

                localStorage.setItem(
                  'blockIndex',
                  JSON.stringify(blockIndexStorage, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value,
                  ),
                )
              }

              dispatch(setIsWithdrawStarted())

              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw Native {{token}} Started`, {
                    token: token.base,
                  }),
                  description: getDoubleLineToastDescription(
                    `${t('Amount')}: ${fixDecimal(amount, token.decimals)} | Txid: ${response.Ok?.block_index}`,
                    `${t('To')}: ${account}`,
                    durationInSeconds,
                  ),
                  status: 'success',
                  isClosable: true,
                })
              }

              // Mixpanel event tracking [Withdrawal Completed]
              analytics.withdrawalCompleted({
                principal: userPrincipal,
                amount: `${fixDecimal(Number(volume), token.decimals)}`,
                currency: token.base,
                transaction_id: response.Ok?.block_index,
              })
            } else if (response && Object.keys(response).includes('Err')) {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw Native {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    getErrorMessageBtcWithdraw(response.Err),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            } else {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw Native {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    t('Something went wrong'),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            }
          })
          .catch((error) => {
            const message = error.response ? error.response.data : error.message
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            withdrawStatus(token.base, 'error')
            if (toastId) {
              toast.update(toastId, {
                title: t('Withdraw Native BTC rejected'),
                description: getSimpleToastDescription(
                  `${t('Error')}: ${message}`,
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
            console.error('Withdraw failed:', message)
          })
      } else {
        const { withdrawCredit } = useWallet()
        withdrawCredit(userAgent, `${token.principal}`, account, Number(volume))
          .then((response: Result | null) => {
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            if (response && Object.keys(response).includes('Ok')) {
              fetchBalances()
              withdrawStatus(token.base, 'success')

              const { volumeInBase } = convertVolumeFromCanister(
                Number(response.Ok?.amount),
                Number(token.decimals),
                0,
              )

              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} Success`, { token: token.base }),
                  description: getSimpleToastDescription(
                    `${t('Amount')}: ${fixDecimal(volumeInBase, token.decimals)} | Txid: ${response.Ok?.txid}`,
                    durationInSeconds,
                  ),
                  status: 'success',
                  isClosable: true,
                })
              }

              // Mixpanel event tracking [Withdrawal Completed]
              analytics.withdrawalCompleted({
                principal: userPrincipal,
                amount: `${fixDecimal(volumeInBase, token.decimals)}`,
                currency: token.base,
                transaction_id: response.Ok?.txid,
              })
            } else if (response && Object.keys(response).includes('Err')) {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    getErrorMessageWithdraw(response.Err),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            } else {
              withdrawStatus(token.base, 'error')
              if (toastId) {
                toast.update(toastId, {
                  title: t(`Withdraw {{token}} rejected`, {
                    token: token.base,
                  }),
                  description: getSimpleToastDescription(
                    t('Something went wrong'),
                    durationInSeconds,
                  ),
                  status: 'error',
                  isClosable: true,
                })
              }
            }
          })
          .catch((error) => {
            const message = error.response ? error.response.data : error.message
            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            withdrawStatus(token.base, 'error')
            if (toastId) {
              toast.update(toastId, {
                title: t('Withdraw rejected'),
                description: getSimpleToastDescription(
                  `${t('Error')}: ${message}`,
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
            console.error('Withdraw failed:', message)
          })
      }
    },
    [fetchBalances, toast, userAgent],
  )

  const handleDeposit = useCallback(
    (amount: number, account: string | undefined, token: TokenMetadata) => {
      const startTime = Date.now()

      const depositStatus = (base: string, depositStatus: string) => {
        setLocalBalances((prevBalances) =>
          prevBalances.map((balance: TokenDataItem) =>
            balance.base === base ? { ...balance, depositStatus } : balance,
          ),
        )
      }
      depositStatus(token.base, 'loading')

      const volume = convertVolumetoCanister(
        Number(amount),
        Number(token.decimals),
      )

      const toastId = toast({
        title: t(`Deposit {{token}} pending`, { token: token.base }),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      const { deposit } = useWallet()
      deposit(userAgent, `${token.principal}`, account, Number(volume))
        .then((response: Result | null) => {
          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          if (response && Object.keys(response).includes('Ok')) {
            fetchBalances()
            depositStatus(token.base, 'success')

            const creditTotalRaw = response.Ok?.credit
            const creditIncRaw = response.Ok?.credit_inc

            const { volumeInBase: creditTotal } = convertVolumeFromCanister(
              Number(creditTotalRaw),
              getDecimals(token),
              0,
            )

            const { volumeInBase: creditInc } = convertVolumeFromCanister(
              Number(creditIncRaw),
              getDecimals(token),
              0,
            )

            if (toastId) {
              toast.update(toastId, {
                title: `${t('Deposit {{token}} Success', { token: token.base })} | Txid: ${response.Ok?.txid}`,
                description: getSimpleToastDescription(
                  `${t('Amount')}: ${fixDecimal(creditInc, token.decimals)} | ${t('Total')}: ${fixDecimal(creditTotal, token.decimals)}`,
                  durationInSeconds,
                ),
                status: 'success',
                isClosable: true,
              })
            }
          } else if (response && Object.keys(response).includes('Err')) {
            depositStatus(token.base, 'error')
            if (toastId) {
              toast.update(toastId, {
                title: t(`Deposit {{token}} rejected`, { token: token.base }),
                description: getSimpleToastDescription(
                  getErrorMessageDeposit(response.Err),
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
          } else {
            depositStatus(token.base, 'error')
            if (toastId) {
              toast.update(toastId, {
                title: t(`Deposit {{token}} rejected`, { token: token.base }),
                description: getSimpleToastDescription(
                  t('Something went wrong'),
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
          }
        })
        .catch((error) => {
          const message = error.response ? error.response.data : error.message
          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          depositStatus(token.base, 'error')
          if (toastId) {
            toast.update(toastId, {
              title: t('Deposit rejected'),
              description: getSimpleToastDescription(
                `${t('Error')}: ${message}`,
                durationInSeconds,
              ),
              status: 'error',
              isClosable: true,
            })
          }
          console.error('Deposit failed:', message)
        })
    },
    [fetchBalances, toast, userAgent],
  )

  const openModal = (modalType: 'btc' | 'icrc1' | 'icpLegacy') => {
    if (modalType === 'btc') setIsQrModalOpenBtc(true)
    else if (modalType === 'icrc1') setIsQrModalOpenIcrc1(true)
    else if (modalType === 'icpLegacy') setIsQrModalOpenIcpLegacy(true)
  }

  const closeModal = (modalType: 'btc' | 'icrc1' | 'icpLegacy') => {
    if (modalType === 'btc') setIsQrModalOpenBtc(false)
    else if (modalType === 'icrc1') setIsQrModalOpenIcrc1(false)
    else if (modalType === 'icpLegacy') setIsQrModalOpenIcpLegacy(false)
  }

  useEffect(() => {
    if (isAuthenticated) fetchBalances()
  }, [userAgent, tokens])

  useEffect(() => {
    setLocalBalances(balances)
  }, [balances])

  useEffect(() => {
    const saved = localStorage.getItem('depositCyclesConfirmation')
    setDepositCyclesConfirmation(saved === 'true')
  }, [])

  return (
    <VStack spacing={1} align="stretch">
      <Flex align="center" justifyContent="space-between">
        <Flex align="center">
          <Image
            src={IcpMonoIcon}
            alt="ICP"
            boxSize="16px"
            mr={2}
            cursor="pointer"
            onClick={() => openModal('icrc1')}
          />

          <Tooltip label={userDepositTooltip} aria-label={userDeposit}>
            <Text
              onClick={copyToClipboardDepositAddress}
              cursor="pointer"
              p={1}
              border="1px solid transparent"
              borderRadius="md"
              _hover={{
                borderColor: bgColorHover,
                borderRadius: 'md',
              }}
            >
              {userDepositAddress}
            </Text>
          </Tooltip>
        </Flex>
        <Flex align="center">
          <Tooltip
            label={claimTooltipText}
            aria-label="Claim Deposit"
            closeDelay={5000}
          >
            <Button
              onClick={handleMultipleTokenClaims}
              onMouseEnter={handleAllTrackedDeposits}
              variant="unstyled"
              p={0}
              m={0}
              display="flex"
              alignItems="center"
            >
              <Image
                src={colorMode === 'dark' ? WalletIconLight : WalletIconDark}
                boxSize={4}
                mr={2}
              />
              <Text>{t('Claim Deposit')}</Text>
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
      <Flex align="center" justifyContent="space-between">
        <Flex align="center">
          <Icon
            as={FaBitcoin}
            boxSize={4}
            mr={2}
            cursor="pointer"
            onClick={() => openModal('btc')}
          />
          <Tooltip
            label={userBtcDepositAddressTooltip}
            aria-label={userBtcDeposit}
          >
            <Text
              onClick={copyToClipboardBtcDepositAddress}
              cursor="pointer"
              p={1}
              border="1px solid transparent"
              borderRadius="md"
              _hover={{
                borderColor: bgColorHover,
                borderRadius: 'md',
              }}
            >
              {userBtcDepositAddress}
            </Text>
          </Tooltip>
        </Flex>
        {depositCyclesConfirmation && (
          <Flex align="center" mr={-1}>
            <Image src={Cycles} boxSize={4} mr={1} />
            <Tooltip label={userDepositCycles} aria-label="User Deposit Cycles">
              <Text
                onClick={copyToClipboardUserDepositCycles}
                cursor="pointer"
                p={1}
                border="1px solid transparent"
                borderRadius="md"
                _hover={{
                  borderColor: bgColorHover,
                  borderRadius: 'md',
                }}
              >
                {t('Deposit Cycles')}
              </Text>
            </Tooltip>
          </Flex>
        )}
      </Flex>
      <Flex align="center" justifyContent="space-between">
        <Flex align="center">
          <Image
            src={IcpMonoIcon}
            alt="ICP"
            boxSize="16px"
            mr={2}
            cursor="pointer"
            onClick={() => openModal('icpLegacy')}
          />
          <Tooltip
            label={userIcpLegacyAccountAddressTooltip}
            aria-label={userIcpLegacyAccount}
          >
            <Text
              onClick={copyToClipboardIcpLegacyAccountAddress}
              cursor="pointer"
              p={1}
              border="1px solid transparent"
              borderRadius="md"
              _hover={{
                borderColor: bgColorHover,
                borderRadius: 'md',
              }}
            >
              {userIcpLegacyAccountAddress}
            </Text>
          </Tooltip>
        </Flex>
      </Flex>

      <Tabs
        index={selectedTab}
        onChange={(index) => setSelectedTab(index)}
        borderColor="transparent"
      >
        <TabList>
          <Tab
            _selected={{ borderBottom: '2px solid', borderColor: 'blue.500' }}
            _focus={{ boxShadow: 'none' }}
            _active={{ background: 'transparent' }}
          >
            {t('My Tokens')}
          </Tab>
          <Tab
            _selected={{ borderBottom: '2px solid', borderColor: 'blue.500' }}
            _focus={{ boxShadow: 'none' }}
            _active={{ background: 'transparent' }}
          >
            {t('Tokens')}
          </Tab>
          <Tab
            _selected={{ borderBottom: '2px solid', borderColor: 'blue.500' }}
            _focus={{ boxShadow: 'none' }}
            _active={{ background: 'transparent' }}
          >
            {t('Transfers')}
          </Tab>
          <Tab
            _selected={{ borderBottom: '2px solid', borderColor: 'blue.500' }}
            _focus={{ boxShadow: 'none' }}
            _active={{ background: 'transparent' }}
          >
            {t('Reports')}
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <TokenTab
              balances={localBalances.filter(
                (token) => token?.volumeInTotal && token.volumeInTotal > 0,
              )}
              userAgent={userAgent}
              userPrincipal={userPrincipal}
              handleNotify={handleNotify}
              handleWithdraw={handleWithdraw}
              handleDeposit={handleDeposit}
              showSearch={true}
              loading={loading}
            />
          </TabPanel>
          <TabPanel>
            <TokenTab
              balances={localBalances}
              userAgent={userAgent}
              userPrincipal={userPrincipal}
              handleNotify={handleNotify}
              handleWithdraw={handleWithdraw}
              handleDeposit={handleDeposit}
              showSearch={true}
              loading={loading}
            />
          </TabPanel>
          <TabPanel>
            <ActionTab tokens={tokens} />
          </TabPanel>
          <TabPanel>
            <LedgerTab tokens={tokens} />
          </TabPanel>
          <TabPanel>
            <ActionTab tokens={tokens} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <QrCodeModal
        isOpen={isQrModalOpenBtc}
        onClose={() => closeModal('btc')}
        value={userBtcDeposit}
        title={t('Bitcoin Deposit Address')}
        subtitle={t('Scan the QR code to deposit Bitcoin')}
        onCopy={copyToClipboardBtcDepositAddress}
      />

      <QrCodeModal
        isOpen={isQrModalOpenIcrc1}
        onClose={() => closeModal('icrc1')}
        value={userDeposit}
        title={t('ICRC-1 Tokens Deposit Address')}
        subtitle={t('Scan the QR code to deposit ICRC-1 Tokens')}
        onCopy={copyToClipboardDepositAddress}
      />

      <QrCodeModal
        isOpen={isQrModalOpenIcpLegacy}
        onClose={() => closeModal('icpLegacy')}
        value={userIcpLegacyAccount}
        title={t('ICP Legacy Deposit Address')}
        subtitle={t('Scan the QR code to deposit ICP Legacy')}
        onCopy={copyToClipboardIcpLegacyAccountAddress}
      />
    </VStack>
  )
}

export default WalletContent
