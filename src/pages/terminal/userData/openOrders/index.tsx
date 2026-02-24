import React, { useCallback, useEffect, useState } from 'react'

import { CloseIcon } from '@chakra-ui/icons'
import {
  Box,
  Flex,
  IconButton,
  Image,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Row } from 'react-table'

import tableContent from './openOrdersTable'
import LoginButtonComponent from '../../../../components/loginButton'
import PaginationTable, {
  ColumnWithSorting,
  pgSizeDinamic,
} from '../../../../components/paginationTable'
import useAuctionQuery from '../../../../hooks/useAuctionQuery'
import useOpenOrders from '../../../../hooks/useOrders'
import { AppDispatch, RootState } from '../../../../store'
import { setIsRefreshBalances } from '../../../../store/balances'
import {
  setIsRefreshUserData,
  setOpenOrders,
  setOrderDetails,
} from '../../../../store/orders'
import { setTrades } from '../../../../store/trades'
import { Result, TokenDataItem } from '../../../../types'
import {
  convertPriceFromCanister,
  convertVolumeFromCanister,
  getMinimumFractionDigits,
} from '../../../../utils/calculationsUtils'
import { analytics } from '../../../../utils/mixpanelUtils'
import { getErrorMessageCancelOrder } from '../../../../utils/orderUtils'
import { getSimpleToastDescription } from '../../../../utils/uiUtils'

const OpenOrders: React.FC = () => {
  const bgColor = useColorModeValue('grey.200', 'grey.700')
  const fontColor = useColorModeValue('grey.700', 'grey.25')
  const { t } = useTranslation()
  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })
  const dispatch = useDispatch<AppDispatch>()
  const pgSize = pgSizeDinamic()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [openOrdersFiltered, setOpenOrdersFiltered] = useState<TokenDataItem[]>(
    [],
  )
  const [darkOrders, setDarkOrders] = useState<TokenDataItem[]>([])
  const [darkOrdersFiltered, setDarkOrdersFiltered] = useState<TokenDataItem[]>(
    [],
  )
  const [darkCanceling, setDarkCanceling] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllMarkets, setShowAllMarkets] = useState(false)
  const [toggleVolume, setToggleVolume] = useState('base')
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const userPrincipal = useSelector(
    (state: RootState) => state.auth.userPrincipal,
  )
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )
  const isResizeUserData = useSelector(
    (state: RootState) => state.uiSettings.isResizeUserData,
  )
  const isRefreshUserData = useSelector(
    (state: RootState) => state.orders.isRefreshUserData,
  )
  const orderSettings = useSelector(
    (state: RootState) => state.orders.orderSettings,
  )
  const orderDetails = useSelector(
    (state: RootState) => state.orders.orderDetails,
  )
  const openOrders = useSelector((state: RootState) => state.orders.openOrders)
  const tokens = useSelector((state: RootState) => state.tokens.tokens)
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const selectedQuote = useSelector(
    (state: RootState) => state.tokens.selectedQuote,
  )
  const symbol = Array.isArray(selectedSymbol)
    ? selectedSymbol[0]
    : selectedSymbol

  const fetchOpenOrders = async () => {
    if (selectedQuote) {
      setLoading(true)

      const { getQuerys } = useAuctionQuery()
      const {
        orders: openOrdersRaw = [],
        trades: tradesRaw = [],
        darkOrders: darkOrdersRaw = [],
      } = await getQuerys(userAgent, {
        tokens: tokens,
        selectedQuote: selectedQuote,
        priceDigitsLimit: orderSettings.orderPriceDigitsLimit,
        queryTypes: ['open_orders', 'dark_order_books', 'transaction_history'],
      })

      dispatch(setOpenOrders(openOrdersRaw))
      dispatch(setTrades(tradesRaw))
      filterOpenOrders(openOrdersRaw)
      setDarkOrders(darkOrdersRaw)
      filterDarkOrders(darkOrdersRaw)
      setLoading(false)
    }
  }

  const filterOpenOrders = (openOrders: TokenDataItem[]) => {
    if (showAllMarkets) {
      setOpenOrdersFiltered(() =>
        openOrders.map((order) =>
          orderDetails.type !== '' && order.id === orderDetails.id
            ? { ...order, replacing: true }
            : { ...order, replacing: false },
        ),
      )
    } else {
      const filtered = openOrders.filter(
        (openOrder) => openOrder.symbol === symbol?.value,
      )
      setOpenOrdersFiltered(() =>
        filtered.map((order) =>
          orderDetails.type !== '' && order.id === orderDetails.id
            ? { ...order, replacing: true }
            : { ...order, replacing: false },
        ),
      )
    }
  }

  const filterDarkOrders = (orders: TokenDataItem[]) => {
    const filtered = showAllMarkets
      ? orders
      : orders.filter((o) => o.symbol === symbol?.value)
    setDarkOrdersFiltered(filtered)
  }

  const handleCheckboxChange = useCallback((e: boolean) => {
    setShowAllMarkets(e)
  }, [])

  const handleRefreshClick = useCallback(() => {
    dispatch(setIsRefreshUserData())
  }, [dispatch])

  const handleReplaceOrderClick = (
    id: bigint | undefined,
    base: string | undefined,
    volumeInBase: number | undefined,
    volumeInQuote: number | undefined,
    price: number | undefined,
    type: string | undefined,
  ) => {
    if (orderDetails.id !== id) {
      setOpenOrdersFiltered((prevState) =>
        prevState.map((order) =>
          order.id === id
            ? { ...order, replacing: true }
            : { ...order, replacing: false },
        ),
      )

      dispatch(
        setOrderDetails({
          id,
          base,
          volumeInBase,
          volumeInQuote,
          price,
          type,
        }),
      )
    }
  }

  const handleCancelOrderClick = useCallback(
    async (id: bigint | undefined, type: string | undefined) => {
      const refreshOpenOrders = (loading: boolean) => {
        if (!loading) dispatch(setIsRefreshUserData())

        setOpenOrdersFiltered((prevState) =>
          prevState.map((order) =>
            order.id === id ? { ...order, loading } : order,
          ),
        )
      }

      const startTime = Date.now()

      dispatch(
        setOrderDetails({
          id: 0n,
          volumeInBase: 0n,
          volumeInQuote: 0n,
          price: 0,
          type: '',
        }),
      )

      refreshOpenOrders(true)

      const toastId = toast({
        title: t('Cancel order pending'),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      const { cancelOrder } = useOpenOrders()
      cancelOrder(userAgent, id, type)
        .then((response: Result) => {
          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          if (response.length > 0 && Object.keys(response[0]).includes('Ok')) {
            if (toastId) {
              toast.update(toastId, {
                title: t('Success'),
                description: getSimpleToastDescription(
                  t('Order cancelled'),
                  durationInSeconds,
                ),
                status: 'success',
                isClosable: true,
              })
            }

            const formattedPrice = convertPriceFromCanister(
              Number(response[0].Ok[3]),
              Number(symbol?.decimals),
              selectedQuote.decimals,
            )

            const { volumeInBase } = convertVolumeFromCanister(
              Number(response[0].Ok[2]),
              Number(symbol?.decimals),
              formattedPrice,
            )

            // Mixpanel event tracking [Bid/Ask Canceled]
            const eventData = {
              principal: userPrincipal,
              auction_id: `${id}`,
              price: `${formattedPrice}`,
              asset: symbol?.base ?? 'UNKNOWN',
            }

            if (type === 'buy') {
              analytics.bidCanceled({
                ...eventData,
                bid_amount: `${volumeInBase}`,
              })
            } else {
              analytics.askCanceled({
                ...eventData,
                ask_amount: `${volumeInBase}`,
              })
            }
          } else {
            if (toastId) {
              toast.update(toastId, {
                title: t('Cancel order rejected'),
                description: getSimpleToastDescription(
                  getErrorMessageCancelOrder(response[0].Err),
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }
          }

          refreshOpenOrders(false)
          dispatch(setIsRefreshBalances())
        })
        .catch((error) => {
          const message = error.response ? error.response.data : error.message

          const endTime = Date.now()
          const durationInSeconds = (endTime - startTime) / 1000

          if (toastId) {
            toast.update(toastId, {
              title: t('Cancel order rejected'),
              description: getSimpleToastDescription(
                `${t('Error')}: ${message}`,
                durationInSeconds,
              ),
              status: 'error',
              isClosable: true,
            })
          }

          refreshOpenOrders(false)
          console.error('Cancellation failed:', message)
        })
    },
    [userAgent, toast, dispatch],
  )

  const handleToggleVolume = useCallback(() => {
    setToggleVolume((prevState) => (prevState === 'quote' ? 'base' : 'quote'))
  }, [])

  const { tableColumns, hiddenColumns, sortBy } = tableContent(
    toggleVolume,
    handleToggleVolume,
    handleReplaceOrderClick,
    handleCancelOrderClick,
  )

  const handleCancelDarkBook = useCallback(
    async (principal: string | undefined) => {
      if (!principal) return
      setDarkCanceling(principal)
      const toastId = toast({
        title: t('Cancel dark book pending'),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })
      const startTime = Date.now()
      try {
        const { deleteDarkOrderBook } = useOpenOrders()
        const res: any = await deleteDarkOrderBook(userAgent, {
          principal,
        } as any)
        const endTime = Date.now()
        const durationInSeconds = (endTime - startTime) / 1000
        if (res && res.Ok !== undefined) {
          toast.update(toastId, {
            title: t('Success'),
            description: getSimpleToastDescription(
              t('Dark book cancelled'),
              durationInSeconds,
            ),
            status: 'success',
            isClosable: true,
          })
          dispatch(setIsRefreshUserData())
        } else {
          toast.update(toastId, {
            title: t('Cancel dark book rejected'),
            description: getSimpleToastDescription(
              res && res.Err ? JSON.stringify(res.Err) : t('Unknown error'),
              durationInSeconds,
            ),
            status: 'error',
            isClosable: true,
          })
        }
      } catch (e: any) {
        const endTime = Date.now()
        const durationInSeconds = (endTime - startTime) / 1000
        toast({
          title: t('Cancel dark book rejected'),
          description: getSimpleToastDescription(
            `${t('Error')}: ${e?.message || e}`,
            durationInSeconds,
          ),
          status: 'error',
          isClosable: true,
        })
      } finally {
        setDarkCanceling(null)
      }
    },
    [userAgent, toast, dispatch],
  )

  const darkTableColumns: ColumnWithSorting<TokenDataItem>[] = [
    {
      Header: t('Symbol'),
      accessor: 'symbol',
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { symbol, base, quote, logo } = row.original
        return (
          <Flex justifyContent="left" alignItems="center">
            <Image src={logo} alt={symbol} h="20px" w="20px" />
            <Text ml="5px" fontWeight="600">
              {base}
            </Text>
            <Text fontSize="10px">/{quote}</Text>
          </Flex>
        )
      },
    },
    {
      Header: t('Side'),
      accessor: 'type',
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { type } = row.original
        return (
          <Text
            textAlign="center"
            color={type === 'buy' ? 'green.500' : 'red.500'}
          >
            {type === 'buy' ? t('BUY') : t('SELL')}
          </Text>
        )
      },
    },
    {
      Header: t('Limit'),
      accessor: 'price',
      sortType: (
        rowA: Row<TokenDataItem>,
        rowB: Row<TokenDataItem>,
        columnId: string,
      ) => {
        const a = rowA.original[columnId] as number
        const b = rowB.original[columnId] as number
        return a > b ? 1 : a < b ? -1 : 0
      },
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { price, priceDigitsLimit } = row.original
        return (
          <Text textAlign="center">
            {price.toLocaleString('en-US', {
              minimumFractionDigits: getMinimumFractionDigits(
                String(price),
                Number(priceDigitsLimit),
              ),
              maximumFractionDigits: priceDigitsLimit,
            })}
          </Text>
        )
      },
    },
    {
      Header: t('Amount'),
      accessor: 'volume',
      sortType: (rowA, rowB) => {
        const valA =
          toggleVolume === 'quote'
            ? rowA.original.volumeInQuote
            : rowA.original.volumeInBase
        const valB =
          toggleVolume === 'quote'
            ? rowB.original.volumeInQuote
            : rowB.original.volumeInBase
        return valA - valB
      },
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const {
          quote,
          base,
          volumeInQuote,
          volumeInBase,
          quoteDecimals,
          baseDecimals,
          volumeInBaseDecimals,
          volumeInQuoteDecimals,
        } = row.original

        const volumeBaseAllDecimals = volumeInBase.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: baseDecimals,
        })

        const volumeBase = volumeInBase.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: volumeInBaseDecimals,
        })

        const volumeQuoteAllDecimals = volumeInQuote.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: quoteDecimals,
        })

        const volumeQuoteDecimals = volumeInQuote.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: volumeInQuoteDecimals,
        })
        return (
          <Text
            textAlign="center"
            onClick={handleToggleVolume}
            sx={{ cursor: 'pointer' }}
          >
            {toggleVolume === 'quote' ? (
              <Tooltip
                label={`${volumeQuoteAllDecimals} ${quote}`}
                aria-label="Quote value"
              >
                <Text as="span">
                  {volumeQuoteDecimals}{' '}
                  <Text as="span" fontSize="10px">
                    {quote}
                  </Text>
                </Text>
              </Tooltip>
            ) : (
              <Tooltip
                label={`${volumeBaseAllDecimals} ${base}`}
                aria-label="Base value"
              >
                <Text as="span">
                  {volumeBase}{' '}
                  <Text as="span" fontSize="10px">
                    {base}
                  </Text>
                </Text>
              </Tooltip>
            )}
          </Text>
        )
      },
    },
    {
      Header: t('Actions'),
      accessor: 'actions',
      disableSortBy: true,
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { principal } = row.original as any
        return (
          <IconButton
            aria-label={t('Cancel dark book')}
            size="xs"
            variant="ghost"
            icon={<CloseIcon />}
            isLoading={darkCanceling === principal}
            onClick={() => handleCancelDarkBook(principal)}
          />
        )
      },
    },
  ]

  useEffect(() => {
    filterOpenOrders(openOrders)
    filterDarkOrders(darkOrders)
    if (showAllMarkets) setToggleVolume('quote')
  }, [showAllMarkets])

  useEffect(() => {
    if (orderDetails.type === '') {
      setOpenOrdersFiltered((prevState) =>
        prevState.map((order) =>
          order.replacing ? { ...order, replacing: false } : order,
        ),
      )
    }
  }, [orderDetails])

  useEffect(() => {
    if (isAuthenticated) fetchOpenOrders()
    else setShowAllMarkets(false)
  }, [userAgent, selectedQuote, symbol, isRefreshUserData])

  return (
    <Box
      filter={loading ? 'blur(5px)' : 'none'}
      pointerEvents={loading ? 'none' : 'auto'}
    >
      {!isAuthenticated ? (
        <LoginButtonComponent
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          symbol={symbol}
          height="20vh"
        />
      ) : (
        <>
          <Box>
            <PaginationTable
              columns={tableColumns}
              data={openOrdersFiltered}
              hiddenColumns={hiddenColumns}
              searchBy={true}
              sortBy={sortBy}
              tableSize="sm"
              fontSize="11px"
              bgColor={bgColor}
              fontColor={fontColor}
              emptyMessage={t('no order found')}
              pgSize={isResizeUserData ? 15 : pgSize}
              onClick={(c) => c}
              onClickAllMarkets={handleCheckboxChange}
              onClickRefresh={handleRefreshClick}
            />
          </Box>
          {darkOrders?.length > 0 && (
            <Box>
              <Text fontWeight="bold" mb={2}>
                {t('Dark orders')}
              </Text>
              <PaginationTable
                columns={darkTableColumns}
                data={darkOrdersFiltered}
                hiddenColumns={['base', 'quote']}
                sortBy={[]}
                tableSize="sm"
                fontSize="11px"
                bgColor={bgColor}
                fontColor={fontColor}
                emptyMessage={t('no order found')}
                pgSize={isResizeUserData ? 15 : pgSize}
                onClick={(c) => c}
                onClickAllMarkets={handleCheckboxChange}
                onClickRefresh={handleRefreshClick}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default OpenOrders
