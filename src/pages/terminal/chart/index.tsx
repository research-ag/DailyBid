import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Switch,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'

import EChart from './echart'
//import Chart from './chart'
import useAuctionQuery from '../../../hooks/useAuctionQuery'
import { AppDispatch, RootState } from '../../../store'
import { setHeaderInformation, setPricesHistory } from '../../../store/prices'
import { DataItem } from '../../../types'
import { calculateHeaderInformation } from '../../../utils/headerInformationUtils'

const ChartPlot = () => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.700', 'grey.25')
  const dispatch = useDispatch<AppDispatch>()
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const selectedQuote = useSelector(
    (state: RootState) => state.tokens.selectedQuote,
  )
  const orderSettings = useSelector(
    (state: RootState) => state.orders.orderSettings,
  )
  const priceHistoryData = useSelector(
    (state: RootState) => state.prices.pricesHistory,
  )
  const auctionOnlyHistory = useMemo(
    () =>
      (priceHistoryData as DataItem[]).filter((p) => p.source !== 'immediate'),
    [priceHistoryData],
  )
  const isRefreshPrices = useSelector(
    (state: RootState) => state.prices.isRefreshPrices,
  )
  const symbol = Array.isArray(selectedSymbol)
    ? selectedSymbol[0]
    : selectedSymbol

  const [chartData, setChartData] = useState<DataItem[]>([])
  const [volumeAxis, setVolumeAxis] = useState('base')
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('1W')

  const fetchPrices = useCallback(async () => {
    if (symbol && symbol.principal && selectedQuote) {
      setLoading(true)
      dispatch(setHeaderInformation(null))

      const { getQuerys } = useAuctionQuery()
      const { pricesHistory: prices, orderBookInfo } = await getQuerys(
        userAgent,
        {
          selectedSymbol: symbol,
          selectedQuote: selectedQuote,
          priceDigitsLimit: orderSettings.orderPriceDigitsLimit,
          queryTypes: ['price_history', 'order_book_info'],
        },
      )

      const headerInformationCalculated = calculateHeaderInformation(
        prices,
        orderBookInfo[0][1],
      )

      dispatch(setHeaderInformation(headerInformationCalculated))

      dispatch(setPricesHistory(prices))
      setVolumeAxis('base')
      setLoading(false)
    }
  }, [dispatch, symbol, selectedQuote, orderSettings])

  const handleToggleVolumeAxis = () => {
    setVolumeAxis((prevState) => (prevState === 'quote' ? 'base' : 'quote'))
  }

  const onChangeTimeframe = useCallback(
    (newTimeframe: string) => {
      setTimeframe(newTimeframe)
      const startDate = new Date()
      if (newTimeframe === '1D') {
        startDate.setDate(startDate.getDate() - 1)
      } else if (newTimeframe === '1W') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (newTimeframe === '1M') {
        startDate.setMonth(startDate.getMonth() - 1)
      } else {
        setChartData(auctionOnlyHistory)
        return
      }
      const filtered = auctionOnlyHistory.filter((item) => {
        const itemDate = new Date(item.datetime)
        return itemDate >= startDate
      })
      setChartData(filtered)
    },
    [auctionOnlyHistory],
  )

  useEffect(() => {
    onChangeTimeframe(timeframe)
  }, [auctionOnlyHistory, timeframe, onChangeTimeframe])

  useEffect(() => {
    fetchPrices()
  }, [selectedSymbol, selectedQuote, isRefreshPrices])

  useEffect(() => {
    const updatedData = chartData.map((item) => {
      if (volumeAxis === 'quote') {
        return {
          ...item,
          volume: item.volumeInQuote,
          volumeDecimals: item.volumeInQuoteDecimals,
        }
      } else {
        return {
          ...item,
          volume: item.volumeInBase,
          volumeDecimals: item.volumeInBaseDecimals,
        }
      }
    })
    setChartData(updatedData)
  }, [volumeAxis])

  return (
    <Box position="relative">
      <Box
        filter={loading ? 'blur(5px)' : 'none'}
        pointerEvents={loading ? 'none' : 'auto'}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >
          <Box>
            {['1D', '1W', '1M', 'All'].map((label) => (
              <Button
                key={label}
                onClick={() => onChangeTimeframe(label)}
                variant="unstyled"
                _hover={{
                  bg: bgColor,
                  color: fontColor,
                }}
                bg={timeframe === label ? bgColor : 'transparent'}
                color={timeframe === label ? fontColor : 'inherit'}
                fontSize="sm"
                size="sm"
                borderRadius="0"
              >
                {label}
              </Button>
            ))}
          </Box>
          <Box>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="volume-axis-switch" mb="0" fontSize="14px">
                {symbol?.quote}
              </FormLabel>
              <Switch
                id="volume-axis-switch"
                isChecked={volumeAxis === 'base'}
                onChange={handleToggleVolumeAxis}
                size="sm"
                sx={{
                  '& .chakra-switch__track': {
                    bg: 'grey.500',
                  },
                  '& .chakra-switch__track[data-checked]': {
                    bg: 'grey.500',
                  },
                }}
              />
              <FormLabel
                htmlFor="volume-axis-switch"
                mb="0"
                ml="2"
                fontSize="14px"
              >
                {symbol?.base}
              </FormLabel>
            </FormControl>
          </Box>
        </Box>
        <EChart
          data={chartData}
          volumeAxis={volumeAxis === 'quote' ? symbol?.quote : symbol?.base}
        />
      </Box>
    </Box>
  )
}

export default ChartPlot
