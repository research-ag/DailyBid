import { useState, useEffect, useCallback } from 'react'

import {
  Box,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Flex,
  Text,
  FormLabel,
  FormControl,
  useDisclosure,
  useToast,
  Spinner,
  useColorModeValue,
  Radio,
  RadioGroup,
  Checkbox,
} from '@chakra-ui/react'
import { useFormik } from 'formik'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import * as Yup from 'yup'

import TradeTypeSelector from './tradeTypeSelector'
import CustomSlider from '../../../components/customSlider'
import LoginButtonComponent from '../../../components/loginButton'
import useAuctionQuery from '../../../hooks/useAuctionQuery'
import useOrders from '../../../hooks/useOrders'
import { RootState, AppDispatch } from '../../../store'
import { setUserPoints } from '../../../store/auth'
import { setBalances } from '../../../store/balances'
import { setOrderDetails, setIsRefreshUserData } from '../../../store/orders'
import { setSelectedSymbol } from '../../../store/tokens'
import { Result, TokenDataItem } from '../../../types'
import { Option } from '../../../types'
import {
  convertExponentialToDecimal,
  convertVolumeFromCanister,
  formatSignificantDigits,
} from '../../../utils/calculationsUtils'
import {
  convertPriceToCanister,
  convertVolumetoCanister,
  volumeStepSizeDecimals,
  volumeCalculateStepSize,
  priceDigitLimitValidate,
  volumeDecimalsValidate,
  fixDecimal,
} from '../../../utils/calculationsUtils'
import { analytics } from '../../../utils/mixpanelUtils'
import {
  validationPlaceOrder,
  getErrorMessagePlaceOrder,
} from '../../../utils/orderUtils'
import { getSimpleToastDescription } from '../../../utils/uiUtils'

const Trading = () => {
  const { t } = useTranslation()
  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })
  const dispatch = useDispatch<AppDispatch>()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const fontColor = useColorModeValue('grey.800', 'grey.200')

  const [tradeType, setTradeType] = useState('buy')
  const [typeOrder, setTypeOrder] = useState('Auction')
  const [darkOrderBookMode, setDarkOrderBookMode] = useState(false)
  const [amountType, setAmountType] = useState('base')
  const [loading, setLoading] = useState(true)
  const [baseStepSize, setBaseStepSize] = useState<number | null>(null)
  const [baseStepSizeDecimal, setBaseStepSizeDecimal] = useState<
    number | undefined
  >(undefined)
  const [available, setAvailable] = useState<TokenDataItem | null>(null)
  const [selectedPercentage, setSelectedPercentage] = useState(null)
  const [priceValue, setPriceValue] = useState<number | null>(null)
  const [currentSliderValue, setCurrentSliderValue] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [darkBatch, setDarkBatch] = useState<
    { volumeInBase: bigint; price: number; type: string }[]
  >([])

  const addCurrentToDarkBatch = () => {
    if (!selectedSymbol) return
    const price = convertPriceToCanister(
      Number(formik.values.price),
      Number(symbol?.decimals),
      selectedQuote.decimals,
    )
    const volume = convertVolumetoCanister(
      Number(formik.values.baseAmount),
      Number(symbol?.decimals),
    )
    if (!price || !volume) return
    setDarkBatch((prev) => [
      ...prev,
      { volumeInBase: BigInt(volume), price, type: tradeType },
    ])
    formik.setFieldValue('baseAmount', '')
    formik.setFieldValue('quoteAmount', '')
  }

  const clearDarkBatch = () => setDarkBatch([])

  const submitDarkBatch = async () => {
    if (!selectedSymbol || darkBatch.length === 0) return
    const title = t('Dark orders pending')
    const toastId = toast({
      title,
      description: t('Please wait...'),
      status: 'loading',
      duration: null,
      isClosable: true,
    })
    const startTime = Date.now()
    try {
      const { manageDarkOrderBook } = useOrders()
      const res: any = await manageDarkOrderBook(
        userAgent,
        symbol,
        darkBatch as any,
      )
      const endTime = Date.now()
      const durationInSeconds = (endTime - startTime) / 1000
      if (res && res.Ok) {
        toast.update(toastId, {
          title: t('Success'),
          description: getSimpleToastDescription(
            t('Dark order book set successfully'),
            durationInSeconds,
          ),
          status: 'success',
          isClosable: true,
        })
        clearDarkBatch()
        dispatch(setIsRefreshUserData())
      } else {
        toast.update(toastId, {
          title: t('Failed to set dark order book'),
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
        title: t('Failed to set dark order book'),
        description: getSimpleToastDescription(
          `${t('Error')}: ${e?.message || e}`,
          durationInSeconds,
        ),
        status: 'error',
        isClosable: true,
      })
    }
  }

  const { userAgent } = useSelector((state: RootState) => state.auth)
  const userPrincipal = useSelector(
    (state: RootState) => state.auth.userPrincipal,
  )
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )
  const openOrders = useSelector((state: RootState) => state.orders.openOrders)
  const orderDetails = useSelector(
    (state: RootState) => state.orders.orderDetails,
  )
  const tokens = useSelector((state: RootState) => state.tokens.tokens)
  const balances = useSelector((state: RootState) => state.balances.balances)
  const isRefreshUserData = useSelector(
    (state: RootState) => state.orders.isRefreshUserData,
  )
  const isRefreshBalances = useSelector(
    (state: RootState) => state.balances.isRefreshBalances,
  )
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const selectedQuote = useSelector(
    (state: RootState) => state.tokens.selectedQuote,
  )
  const orderSettings = useSelector(
    (state: RootState) => state.orders.orderSettings,
  )
  const pricesInfo = useSelector((state: RootState) => state.prices.pricesInfo)
  const symbol = Array.isArray(selectedSymbol)
    ? selectedSymbol[0]
    : selectedSymbol

  const initialValues = {
    price: '',
    quoteAmount: '',
    baseAmount: '',
    amountType: amountType,
    available: available?.volumeInAvailable,
    submit: false,
  }

  const validationSchema = Yup.object().shape(
    {
      available: Yup.number(),
      price: Yup.number().required('').typeError(''),
      quoteAmount: Yup.number()
        .typeError('')
        .when('baseAmount', (baseAmount, schema) =>
          baseAmount ? schema.required('') : schema,
        )
        .when(['amountType', 'available'], {
          is: (amountType: string, available: number) =>
            amountType === 'quote' && available <= 0,
          then: (schema) =>
            schema.test('no-credit', 'No credit', function () {
              return false
            }),
        })
        .test('valid-amount', function (value) {
          const { path, createError } = this

          const quoteAmountNat = Number(
            convertVolumetoCanister(Number(value), selectedQuote.decimals),
          )

          return (
            quoteAmountNat >=
              Number(orderSettings.orderQuoteVolumeMinimumNat) ||
            createError({
              path,
              message: `${t('Amount must be')} ≥ ${orderSettings.orderQuoteVolumeMinimum} ${symbol?.quote}`,
            })
          )
        })
        .when('amountType', {
          is: 'quote',
          then: (schema) =>
            schema.max(
              available?.volumeInAvailable || 0,
              t(`Not enough funds`),
            ),
        }),

      baseAmount: Yup.number()
        .typeError('')
        .when('quoteAmount', (quoteAmount, schema) =>
          quoteAmount ? schema.required('') : schema,
        )
        .when(['amountType', 'available'], {
          is: (amountType: string, available: number) =>
            amountType === 'base' && available <= 0,
          then: (schema) =>
            schema.test('no-credit', 'No credit', function () {
              return false
            }),
        })
        .test('is-valid-step-size', function (value) {
          const { volume: calculatedBaseVolume } = handleBaseVolumeCalculate(
            Number(value),
            formik.values.price,
          )

          if (!calculatedBaseVolume) return true

          return (
            value === Number(calculatedBaseVolume) ||
            this.createError({
              path: this.path,
              message: `${t('Amount must be a multiple of')} ${fixDecimal(baseStepSize || 0, baseStepSizeDecimal)}`,
            })
          )
        })

        .when('amountType', {
          is: 'base',
          then: (schema) => {
            return schema.test('valid-amount', function (value) {
              const { path, createError } = this

              const priceNat = Number(
                convertPriceToCanister(
                  Number(formik.values.price),
                  Number(symbol?.decimals),
                  selectedQuote.decimals,
                ),
              )

              const baseAmountNat = Number(
                convertVolumetoCanister(
                  Number(value),
                  Number(symbol?.decimals),
                ),
              )

              const baseAmountOrderDetailsNat = Number(
                convertVolumetoCanister(
                  Number(orderDetails.volumeInBase),
                  Number(symbol?.decimals),
                ),
              )

              const availableBalance = Number(available?.volumeInAvailableNat)

              const orderAmount: number =
                availableBalance > 0 && priceNat > 0
                  ? tradeType === 'buy'
                    ? priceNat * baseAmountNat
                    : baseAmountNat
                  : 0

              const orderDetailsAmount: number =
                availableBalance > 0 && priceNat > 0
                  ? tradeType === 'buy'
                    ? priceNat * baseAmountOrderDetailsNat
                    : baseAmountOrderDetailsNat
                  : 0

              const insufficientFunds =
                (orderAmount > availableBalance && orderDetails.id === 0n) ||
                (orderAmount > orderDetailsAmount + availableBalance &&
                  orderDetails.id !== 0n)

              if (insufficientFunds) {
                return createError({ path, message: t('Not enough funds') })
              }

              return true
            })
          },
        }),
    },
    [['baseAmount', 'quoteAmount']],
  )

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values, { setStatus, setSubmitting }) => {
      setMessage(null)

      const startTime = Date.now()

      const price = convertPriceToCanister(
        Number(values.price),
        Number(symbol?.decimals),
        selectedQuote.decimals,
      )

      const volume = convertVolumetoCanister(
        Number(values.baseAmount),
        Number(symbol?.decimals),
      )

      const order = {
        id: orderDetails.id,
        volumeInBase: volume,
        price,
        type: tradeType,
      }

      if (orderDetails.id === 0n) {
        const orderExists = validationPlaceOrder(
          openOrders,
          symbol?.base,
          symbol?.quote,
          tradeType,
          Number(values.price),
          selectedQuote,
        )

        if (orderExists) {
          setStatus({ success: false })
          setSubmitting(false)
          setMessage(orderExists)
          return
        }
      }

      const title =
        orderDetails.id === 0n
          ? t('Create order pending')
          : t('Replace order pending')

      const toastId = toast({
        title,
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      const { placeOrder, replaceOrder } = useOrders()

      if (orderDetails.id === 0n) {
        placeOrder(userAgent, symbol, order, typeOrder)
          .then(async (response: Result) => {
            setStatus({ success: true })
            setSubmitting(false)
            setMessage(null)
            dispatch(setIsRefreshUserData())

            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            if (
              response.length > 0 &&
              Object.keys(response[0]).includes('Ok')
            ) {
              const ok = response[0].Ok
              const status = ok && ok[1]
              const executed =
                status &&
                Object.prototype.hasOwnProperty.call(status, 'executed')
              const descriptionText = executed
                ? t('Order executed')
                : t('Order created')
              if (toastId) {
                toast.update(toastId, {
                  title: t('Success'),
                  description: getSimpleToastDescription(
                    descriptionText,
                    durationInSeconds,
                  ),
                  status: 'success',
                  isClosable: true,
                })
              }

              // Mixpanel event tracking [Bid/Ask Placed]
              const eventData = {
                principal: userPrincipal,
                auction_id: String(response[0].Ok),
                price: String(order.price),
                asset: symbol?.base ?? 'UNKNOWN',
              }

              if (order.type === 'buy') {
                analytics.bidPlaced({
                  ...eventData,
                  bid_amount: String(order.volumeInBase),
                })
              } else {
                analytics.askPlaced({
                  ...eventData,
                  ask_amount: String(order.volumeInBase),
                })
              }
            } else {
              if (toastId) {
                toast.update(toastId, {
                  title: t('Create order rejected'),
                  description: getSimpleToastDescription(
                    getErrorMessagePlaceOrder(response[0].Err),
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

            if (toastId) {
              toast.update(toastId, {
                title: t('Create order rejected'),
                description: getSimpleToastDescription(
                  `${t('Error')}: ${message}`,
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }

            setStatus({ success: false })
            setSubmitting(false)
            console.error(message)
          })
      } else {
        replaceOrder(userAgent, order)
          .then(async (response: Result) => {
            setStatus({ success: true })
            setSubmitting(false)
            setMessage(null)
            dispatch(setIsRefreshUserData())
            dispatch(
              setOrderDetails({
                id: 0n,
                volumeInBase: 0n,
                volumeInQuote: 0n,
                price: 0,
                type: '',
              }),
            )

            const endTime = Date.now()
            const durationInSeconds = (endTime - startTime) / 1000

            if (Object.keys(response).includes('Ok')) {
              const ok = response.Ok
              const status = ok && ok[1]
              const executed =
                status &&
                Object.prototype.hasOwnProperty.call(status, 'executed')
              const descriptionText = executed
                ? t('Order executed')
                : t('Order replaced')
              if (toastId) {
                toast.update(toastId, {
                  title: t('Success'),
                  description: getSimpleToastDescription(
                    descriptionText,
                    durationInSeconds,
                  ),
                  status: 'success',
                  isClosable: true,
                })
              }
            } else {
              if (toastId) {
                toast.update(toastId, {
                  title: t('Replace order rejected'),
                  description: getSimpleToastDescription(
                    getErrorMessagePlaceOrder(response.Err),
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

            if (toastId) {
              toast.update(toastId, {
                title: t('Replace order rejected'),
                description: getSimpleToastDescription(
                  `${t('Error')}: ${message}`,
                  durationInSeconds,
                ),
                status: 'error',
                isClosable: true,
              })
            }

            setStatus({ success: false })
            setSubmitting(false)
            console.error(message)
          })
      }
    },
  })

  const fetchBalances = useCallback(async () => {
    setLoading(true)
    const { getQuerys } = useAuctionQuery()
    const { credits: balancesCredits = [], points } = await getQuerys(
      userAgent,
      {
        tokens: tokens,
        queryTypes: ['credits'],
      },
    )

    dispatch(setBalances(balancesCredits))
    dispatch(setUserPoints(Number(points)))

    setLoading(false)
  }, [userAgent, tokens, dispatch])

  const updateAvailable = useCallback(
    (type: string) => {
      const { quote, base } = symbol ?? {}
      const token = type === 'buy' ? quote : base

      const availableBalance =
        balances.find((balance) => balance.symbol === token) ?? null

      setAvailable(availableBalance)

      return availableBalance
    },
    [balances, symbol],
  )

  const getTokenPriceValueInfo = () => {
    const tokenNameMap = JSON.parse(`${process.env.ENV_TOKEN_MAP}`)

    const getMappedTokenName = (baseSymbol: string) =>
      tokenNameMap[baseSymbol] || baseSymbol

    const token = pricesInfo.find(
      (token) => token.symbol === getMappedTokenName(`${symbol?.base}`),
    )

    if (token && token.value > 0) {
      // GLDT unit price calculation
      if (token.symbol === 'XAU') {
        const TROY_OUNCE_TO_KG = 0.0311035
        const GLDT_UNIT_FACTOR = 1 / 100000

        const pricePerKg = token.value / TROY_OUNCE_TO_KG
        const gldtUnitPrice = pricePerKg * GLDT_UNIT_FACTOR

        const newValue = formatSignificantDigits(
          String(gldtUnitPrice),
          orderSettings.orderPriceDigitsLimit,
        )

        return newValue
      } else {
        const newValue = formatSignificantDigits(
          String(token.value),
          orderSettings.orderPriceDigitsLimit,
        )
        return newValue
      }
    }
    return ''
  }

  const handleTradeTypeChange = useCallback(
    (type: string) => {
      if (!formik.isSubmitting) {
        setTradeType(type)
        updateAvailable(type)
        setSelectedPercentage(null)
      }
    },
    [formik.isSubmitting, updateAvailable],
  )

  const handleClearForm = useCallback(() => {
    setMessage(null)
    setSelectedPercentage(null)
    handlePercentageClick(0)
    setAmountType('base')
    formik.resetForm({ values: initialValues })
    setPriceValue(null)
    setBaseStepSize(null)

    if (orderDetails.type !== '') {
      dispatch(
        setOrderDetails({
          id: 0n,
          volumeInBase: 0n,
          volumeInQuote: 0n,
          price: 0,
          type: '',
        }),
      )
    }
  }, [formik])

  const handlePercentageClick = useCallback(
    (percentage: any) => {
      setSelectedPercentage(
        percentage === selectedPercentage ||
          !isAuthenticated ||
          !formik.values.price
          ? null
          : percentage,
      )
    },
    [selectedPercentage, isAuthenticated, formik.values.price],
  )

  const handleBaseVolumeDecimal = useCallback(
    (price: string) => {
      const numericPrice = Number(price)

      if (isNaN(numericPrice) || numericPrice <= 0) {
        return null
      }

      const decimal = volumeStepSizeDecimals(
        numericPrice,
        orderSettings.orderQuoteVolumeStep,
        Number(symbol?.decimals),
        selectedQuote.decimals,
      )

      setBaseStepSizeDecimal(decimal)
      return decimal
    },
    [
      orderSettings.orderQuoteVolumeStep,
      symbol?.decimals,
      selectedQuote.decimals,
    ],
  )

  const handleBaseVolumeCalculate = useCallback(
    (value: number, price: string) => {
      const numericPrice = parseFloat(price)

      if (isNaN(numericPrice) || numericPrice <= 0) {
        return {
          volume: null,
          volumeFloor: null,
          stepSize: null,
          stepSizeOverflow: null,
        }
      }

      const decimalPlaces = handleBaseVolumeDecimal(price)
      const { volume, volumeFloor, stepSize } = volumeCalculateStepSize(
        numericPrice,
        value,
        Number(decimalPlaces),
        orderSettings.orderQuoteVolumeStep,
      )

      const stepSizeDecimalString = convertExponentialToDecimal(stepSize)

      const stepSizeDecimalPart = stepSizeDecimalString.split('.')[1] ?? ''

      const stepSizeOverflow =
        stepSizeDecimalPart.length > (symbol?.decimals || 0)

      if (!stepSizeOverflow) {
        setBaseStepSize(stepSize)
      }

      return { volume, volumeFloor, stepSize, stepSizeOverflow }
    },
    [orderSettings.orderQuoteVolumeStep, symbol?.decimals],
  )

  const handlePriceInputChange = useCallback(
    (value: string) => {
      const numericValue = Number(value)

      if (isNaN(numericValue)) {
        return { price: formik.values.price, volume: null }
      }

      if (
        priceDigitLimitValidate(
          numericValue,
          orderSettings.orderPriceDigitsLimit,
        )
      ) {
        const { volumeFloor } = handleBaseVolumeCalculate(
          parseFloat(formik.values.baseAmount),
          value,
        )

        formik.setFieldValue('price', value)
        return { price: value, volume: volumeFloor }
      }

      return { price: formik.values.price, volume: null }
    },
    [
      formik.values.baseAmount,
      formik.values.price,
      orderSettings.orderPriceDigitsLimit,
      handleBaseVolumeCalculate,
    ],
  )

  const handlePricePercentageCalculate = (percentage: number) => {
    const currentPrice = priceValue || Number(getTokenPriceValueInfo())
    if (currentPrice === 0) {
      formik.setFieldValue('price', '', false)
      return
    }

    const updatedPrice = currentPrice + currentPrice * (percentage / 100)

    const newPrice = formatSignificantDigits(
      String(updatedPrice),
      orderSettings.orderPriceDigitsLimit,
    )

    handlePriceInputChange(newPrice)
  }

  const handleCalculateBaseAmount = useCallback(
    (price: string, quoteAmount: string, volumeFloor: string) => {
      const numericPrice = parseFloat(price)
      const numericQuoteAmount = parseFloat(quoteAmount)

      if (!isNaN(numericPrice) && !isNaN(numericQuoteAmount)) {
        formik.setFieldValue('baseAmount', volumeFloor)
      }
    },
    [],
  )

  const handleCalculateQuoteAmount = useCallback(
    (price: string, baseAmount: string) => {
      const numericPrice = parseFloat(price)
      const numericBaseAmount = parseFloat(baseAmount)

      if (!isNaN(numericPrice) && !isNaN(numericBaseAmount)) {
        const quoteAmount = fixDecimal(
          numericBaseAmount * numericPrice,
          selectedQuote.decimals,
        )
        formik.setFieldValue('quoteAmount', quoteAmount)
      }
    },
    [],
  )

  useEffect(() => {
    const balance = updateAvailable(tradeType)
    const { baseAmount, quoteAmount } = formik.values
    const availableVolume = Number(balance?.volumeInAvailable)

    if (
      (amountType === 'base' && availableVolume < Number(baseAmount)) ||
      (amountType === 'quote' && availableVolume < Number(quoteAmount))
    ) {
      setSelectedPercentage(null)
      formik.setFieldValue('baseAmount', '', false)
      formik.setFieldValue('quoteAmount', '', false)
      formik.setFieldTouched('baseAmount', false)
      formik.setFieldTouched('quoteAmount', false)
    }
  }, [balances])

  useEffect(() => {
    if (symbol?.base !== orderDetails.base) {
      if (isAuthenticated) fetchBalances()
      handleClearForm()
      setTradeType('buy')
    }

    if (!isAuthenticated) {
      formik.setFieldValue('price', '', false)
    } else if (symbol?.base && symbol?.base !== orderDetails.base) {
      const value = getTokenPriceValueInfo()
      if (value) handlePriceInputChange(value)
      else formik.setFieldValue('price', '', false)
    }
    setCurrentSliderValue(0)
  }, [userAgent, symbol])

  useEffect(() => {
    if (isAuthenticated) fetchBalances()
  }, [isRefreshBalances, isRefreshUserData])

  useEffect(() => {
    if (tradeType === 'sell') {
      setAmountType('base')
      formik.setFieldValue('amountType', 'base')
    }

    if (orderDetails.id !== 0n && orderDetails.type !== tradeType) {
      handleClearForm()
    }
  }, [tradeType])

  useEffect(() => {
    formik.setFieldValue('amountType', amountType)
  }, [amountType])

  useEffect(() => {
    formik.setFieldValue('available', available?.volumeInAvailable)
  }, [available])

  useEffect(() => {
    setBaseStepSizeDecimal(symbol?.decimals)
  }, [symbol])

  useEffect(() => {
    if (
      orderDetails.id !== 0n &&
      (orderDetails.type === 'buy' || orderDetails.type === 'sell')
    ) {
      const token = tokens.find((token) => token.base === orderDetails.base)
      if (token) {
        formik.setFieldValue('price', orderDetails.price)
        formik.setFieldValue('baseAmount', orderDetails.volumeInBase)
        formik.setFieldValue('quoteAmount', orderDetails.volumeInQuote)

        handleBaseVolumeCalculate(
          Number(orderDetails.volumeInBase),
          String(orderDetails.price),
        )
        setTradeType(orderDetails.type)

        if (orderDetails.base !== symbol?.base) {
          const option: Option = {
            id: token.symbol,
            value: token.symbol,
            label: token.name,
            image: token.logo,
            base: token.base,
            quote: token.quote,
            decimals: token.decimals,
            principal: token.principal,
          }
          dispatch(setSelectedSymbol(option))
        }
      }
    }
  }, [orderDetails])

  useEffect(() => {
    const price = parseFloat(formik.values.price)

    if (available && selectedPercentage && !isNaN(price)) {
      const auxAvailable =
        orderDetails.id === 0n
          ? available.volumeInBase
          : available.volumeInBase + Number(orderDetails.volumeInBase)

      const percentageAvailable = (selectedPercentage / 100) * auxAvailable

      let baseAmount = 0
      let quoteAmount = 0

      if (tradeType === 'buy') {
        quoteAmount = percentageAvailable
        const { volumeFloor } = handleBaseVolumeCalculate(
          quoteAmount / price,
          formik.values.price,
        )
        baseAmount = parseFloat(volumeFloor || '0')
      } else {
        const { volumeFloor } = handleBaseVolumeCalculate(
          percentageAvailable,
          formik.values.price,
        )
        baseAmount = parseFloat(volumeFloor || '0')
        quoteAmount = baseAmount * price
      }

      formik.setFieldValue('baseAmount', baseAmount)
      formik.setFieldValue(
        'quoteAmount',
        fixDecimal(quoteAmount, selectedQuote.decimals),
      )
    }
  }, [selectedPercentage])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 20000)

      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    if (typeOrder === 'Immediate') {
      setDarkOrderBookMode(false)
    }
  }, [typeOrder])

  return (
    <VStack spacing={4} align="stretch">
      <TradeTypeSelector
        tradeType={tradeType}
        handleTradeTypeChange={handleTradeTypeChange}
      />
      <RadioGroup value={typeOrder} onChange={setTypeOrder}>
        <VStack align="stretch" spacing={2}>
          <Radio value="Auction">Auction</Radio>
          <Radio value="Immediate">Immediate</Radio>
        </VStack>
      </RadioGroup>
      {typeOrder === 'Auction' && (
        <Checkbox onChange={(e) => setDarkOrderBookMode(e.target.checked)}>
          <Text fontSize="14px">{t('Dark orders')}</Text>
        </Checkbox>
      )}
      <Flex direction="column">
        <FormControl variant="floating">
          <Input
            h="58px"
            placeholder=" "
            name="price"
            sx={{ borderRadius: '5px' }}
            isInvalid={!!formik.errors.price && formik.touched.price}
            isDisabled={!selectedSymbol || !isAuthenticated}
            value={formik.values.price}
            onKeyUp={() => formik.validateField('price')}
            onChange={(e) => {
              setSelectedPercentage(null)
              const { price, volume } = handlePriceInputChange(e.target.value)

              setPriceValue(Number(price))

              amountType === 'quote'
                ? handleCalculateBaseAmount(
                    String(price),
                    formik.values.quoteAmount,
                    String(volume),
                  )
                : handleCalculateQuoteAmount(
                    String(price),
                    formik.values.baseAmount,
                  )
            }}
          />
          <FormLabel color="grey.500" fontSize="15px">
            {t('Price')}
          </FormLabel>
          {!!formik.errors.price && formik.touched.price && (
            <Text color="red.500" fontSize="12px">
              {formik.errors.price}
            </Text>
          )}
        </FormControl>

        <Box mt={2} mb={2} width="90%" alignSelf="center">
          <CustomSlider
            step={1}
            unit="%"
            values={[-5, 0, +5]}
            currentValue={currentSliderValue}
            isDisabled={!isAuthenticated}
            colorScheme="grey"
            tooltipBgColor="grey.600"
            tooltipTextColor="white"
            fontSize="12px"
            onChangeValue={(value) => {
              handlePricePercentageCalculate(value),
                setCurrentSliderValue(value)
            }}
          />
        </Box>
      </Flex>
      <Flex direction="column">
        <InputGroup>
          <FormControl variant="floating">
            <Input
              h="58px"
              placeholder=" "
              name="quoteAmount"
              sx={{ borderRadius: '5px' }}
              isInvalid={
                !!formik.errors.quoteAmount && formik.touched.quoteAmount
              }
              isDisabled={
                !formik.values.price || !selectedSymbol || !isAuthenticated
              }
              value={formik.values.quoteAmount}
              onKeyUp={() => {
                formik.validateField('quoteAmount')
                setSelectedPercentage(null)
              }}
              onChange={(e) => {
                formik.handleChange(e)

                const { volumeFloor } = handleBaseVolumeCalculate(
                  parseFloat(e.target.value) / parseFloat(formik.values.price),
                  formik.values.price,
                )

                handleCalculateBaseAmount(
                  formik.values.price,
                  e.target.value,
                  String(volumeFloor),
                )
              }}
            />
            <FormLabel color="grey.500" fontSize="15px">
              {t('Amount')}
            </FormLabel>
          </FormControl>
          <InputRightElement
            h="58px"
            w="auto"
            position="absolute"
            right="0"
            display="flex"
            justifyContent="flex-end"
          >
            <Button
              h="58px"
              w={`${symbol?.base && symbol.base.length * 9}px`}
              fontSize="11px"
              borderRadius="0 5px 5px 0"
              bgColor={
                amountType === 'quote' && tradeType === 'buy'
                  ? 'green.500'
                  : 'grey.500'
              }
              color="grey.25"
              _hover={{
                bg:
                  amountType === 'quote' && tradeType === 'buy'
                    ? 'green.400'
                    : 'grey.400',
                color: 'grey.25',
              }}
              //onClick={() => tradeType === 'buy' && setAmountType('quote')}
            >
              {symbol?.quote}
            </Button>
          </InputRightElement>
        </InputGroup>
        {!!formik.errors.quoteAmount && formik.touched.quoteAmount && (
          <Text color="red.500" fontSize="12px">
            {formik.errors.quoteAmount}
          </Text>
        )}
      </Flex>
      <Flex direction="column">
        <InputGroup>
          <FormControl variant="floating">
            <Input
              h="58px"
              placeholder=" "
              name="baseAmount"
              sx={{ borderRadius: '5px' }}
              isInvalid={
                !!formik.errors.baseAmount && formik.touched.baseAmount
              }
              isDisabled={
                !formik.values.price || !selectedSymbol || !isAuthenticated
              }
              value={formik.values.baseAmount}
              onKeyUp={() => {
                formik.validateField('baseAmount')
                setSelectedPercentage(null)
              }}
              onChange={(e) => {
                formik.handleChange(e)
                if (e.target.value && !isNaN(parseFloat(e.target.value))) {
                  const decimal = handleBaseVolumeDecimal(formik.values.price)
                  const valueValidate = volumeDecimalsValidate(
                    e.target.value,
                    Number(decimal),
                  )
                  formik.setFieldValue('baseAmount', valueValidate)
                  handleCalculateQuoteAmount(formik.values.price, valueValidate)

                  if (
                    formik.values.price &&
                    !isNaN(parseFloat(formik.values.price))
                  ) {
                    handleBaseVolumeCalculate(
                      parseFloat(valueValidate),
                      formik.values.price,
                    )
                  }
                }
              }}
            />
            <FormLabel color="grey.500" fontSize="15px">
              {t('Amount')}
            </FormLabel>
          </FormControl>
          <InputRightElement
            h="58px"
            w="auto"
            position="absolute"
            right="0"
            display="flex"
            justifyContent="flex-end"
          >
            <Button
              h="58px"
              w={`${symbol?.base && symbol.base.length * 9}px`}
              fontSize="11px"
              borderRadius="0 5px 5px 0"
              bgColor={
                amountType === 'base' && tradeType === 'buy'
                  ? 'green.500'
                  : tradeType === 'sell'
                    ? 'red.500'
                    : 'grey.500'
              }
              color="grey.25"
              _hover={{
                bg:
                  amountType === 'base' && tradeType === 'buy'
                    ? 'green.400'
                    : tradeType === 'sell'
                      ? 'red.500'
                      : 'grey.400',
                color: 'grey.25',
              }}
              //onClick={() => tradeType === 'buy' && setAmountType('base')}
            >
              {symbol?.base}
            </Button>
          </InputRightElement>
        </InputGroup>
        {baseStepSize && (
          <Text color={fontColor} fontSize="11px">
            {t('Step Size')}: {fixDecimal(baseStepSize, baseStepSizeDecimal)}
          </Text>
        )}
        {!!formik.errors.baseAmount && formik.touched.baseAmount && (
          <Text color="red.500" fontSize="12px">
            {formik.errors.baseAmount}
          </Text>
        )}
      </Flex>
      <Flex justify="space-between" borderBottom="1px solid gray" pb={2}>
        {[25, 50, 75, 100].map((percentage) => (
          <Button
            key={percentage}
            flex="1"
            size="sm"
            mx={1}
            color={selectedPercentage === percentage ? 'grey.25' : 'inherit'}
            bg={
              selectedPercentage === percentage
                ? tradeType === 'buy'
                  ? 'green.500'
                  : 'red.500'
                : 'transparent'
            }
            onClick={() => handlePercentageClick(percentage)}
            isDisabled={!selectedSymbol}
            _hover={{
              bg: tradeType === 'buy' ? 'green.500' : 'red.500',
              color: 'grey.25',
            }}
          >
            {percentage}%
          </Button>
        ))}
      </Flex>
      {!isAuthenticated ? (
        <LoginButtonComponent
          isOpen={isOpen}
          onOpen={onOpen}
          onClose={onClose}
          symbol={symbol}
          height="10vh"
        />
      ) : (
        <>
          <Box
            filter={loading ? 'blur(5px)' : 'none'}
            pointerEvents={loading ? 'none' : 'auto'}
          >
            <Text textAlign="center" fontSize="14px">
              {t('Available')}:
            </Text>
            <Text textAlign="center" fontSize="12px">
              {available?.volumeInAvailable &&
              symbol &&
              selectedQuote &&
              tradeType ? (
                <>
                  {tradeType === 'buy'
                    ? available.volumeInAvailable.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: selectedQuote?.decimals,
                      })
                    : available.volumeInAvailable.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: symbol.decimals,
                      })}
                </>
              ) : (
                <>{` 0 `}</>
              )}
              <Text as="span" fontSize="11px">
                {` `}
                {tradeType === 'buy' ? symbol?.quote : symbol?.base}
              </Text>
            </Text>
          </Box>{' '}
          {darkOrderBookMode && (
            <Box mt={3}>
              <Text textAlign="center" fontSize="12px">
                {t('Orders in dark batch')}: {darkBatch.length}
              </Text>
              <VStack mt={2} spacing={2}>
                {darkBatch.map((order, idx) => (
                  <Text key={idx} textAlign="left" fontSize="10px">
                    {t(order.type.toUpperCase())}
                    &nbsp;
                    {convertVolumeFromCanister(
                      Number(order.volumeInBase),
                      Number(symbol?.decimals),
                      order.price,
                    ).volumeInBase.toString()}
                    &nbsp;{t('Price')}: {order.price}
                  </Text>
                ))}
              </VStack>
              <VStack mt={2} spacing={2} align="stretch">
                <Button
                  background="grey.500"
                  variant="solid"
                  h="48px"
                  w="100%"
                  color="grey.25"
                  _hover={{ bg: 'grey.400', color: 'grey.25' }}
                  isDisabled={
                    !selectedSymbol ||
                    !formik.values.price ||
                    !formik.values.baseAmount
                  }
                  onClick={addCurrentToDarkBatch}
                >
                  {t('Add to Dark Batch')}
                </Button>
                <Button
                  background={tradeType === 'buy' ? 'green.500' : 'red.500'}
                  variant="solid"
                  h="48px"
                  w="100%"
                  color="grey.25"
                  _hover={{
                    bg: tradeType === 'buy' ? 'green.400' : 'red.400',
                    color: 'grey.25',
                  }}
                  isDisabled={!selectedSymbol || darkBatch.length === 0}
                  onClick={submitDarkBatch}
                >
                  {t('Submit Dark Orders')}
                </Button>
                <Button
                  background="grey.500"
                  variant="solid"
                  h="48px"
                  w="100%"
                  color="grey.25"
                  _hover={{ bg: 'grey.400', color: 'grey.25' }}
                  isDisabled={darkBatch.length === 0}
                  onClick={clearDarkBatch}
                >
                  {t('Clear Dark Batch')}
                </Button>
              </VStack>
            </Box>
          )}
          {!darkOrderBookMode && (
            <Flex direction="row" justifyContent="space-between" gap={2}>
              <Button
                background="grey.500"
                variant="solid"
                h="58px"
                w={formik.isSubmitting ? '100px' : '150px'}
                color="grey.25"
                _hover={{
                  bg: 'grey.400',
                  color: 'grey.25',
                }}
                isDisabled={!selectedSymbol || formik.isSubmitting}
                onClick={handleClearForm}
              >
                {t('Reset')}
              </Button>
              <Button
                background={tradeType === 'buy' ? 'green.500' : 'red.500'}
                variant="solid"
                h="58px"
                w={formik.isSubmitting ? '200px' : '150px'}
                color="grey.25"
                _hover={{
                  bg: tradeType === 'buy' ? 'green.400' : 'red.400',
                  color: 'grey.25',
                }}
                isDisabled={!selectedSymbol || formik.isSubmitting}
                onClick={() => formik.handleSubmit()}
              >
                {formik.isSubmitting ? (
                  <>
                    {orderDetails.id !== 0n ? t('Replacing') : t('Creating')}{' '}
                    <Spinner ml={2} size="sm" color="grey.25" />
                  </>
                ) : orderDetails.id !== 0n ? (
                  t('Replace')
                ) : (
                  t('Create')
                )}
              </Button>
            </Flex>
          )}
        </>
      )}
      {message && (
        <Text textAlign="center" fontSize="13px" color="red.500">
          {message}
        </Text>
      )}
    </VStack>
  )
}

export default Trading
