import React, { useState, useEffect, useMemo } from 'react'

import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Text,
  Checkbox,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import HistoryRow from './historyRow'
import { RootState } from '../../../../store'
import { DataItem } from '../../../../types'
import { setHideIntermediate } from '../../../../store/prices'

const PriceHistory: React.FC = () => {
  const [prices, setPrices] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [toggleVolume, setToggleVolume] = useState('base')
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const pricesHistory = useSelector(
    (state: RootState) => state.prices.pricesHistory,
  )
  const hideIntermediate = useSelector(
    (state: RootState) => state.prices.hideIntermediate,
  )
  const symbol = Array.isArray(selectedSymbol)
    ? selectedSymbol[0]
    : selectedSymbol

  const handleToggleVolume = () => {
    setToggleVolume((prevState) => (prevState === 'quote' ? 'base' : 'quote'))
  }

  const pricesFiltered = useMemo(() => {
    if (pricesHistory.length > 0) {
      const list = hideIntermediate
        ? (pricesHistory as DataItem[]).filter((p) => p.source !== 'immediate')
        : (pricesHistory as DataItem[])
      return [...list].slice(0, 17)
    }
    return []
  }, [pricesHistory, hideIntermediate])

  useEffect(() => {
    setLoading(true)
    const timeout = setTimeout(() => {
      setPrices(pricesFiltered)
      if (symbol) setLoading(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [pricesFiltered, symbol])

  return (
    <Box
      filter={loading ? 'blur(5px)' : 'none'}
      pointerEvents={loading ? 'none' : 'auto'}
    >
      <Flex justifyContent="flex-end" mb={2}>
        <Checkbox
          isChecked={hideIntermediate}
          onChange={(e) => dispatch(setHideIntermediate(e.target.checked))}
        >
          {t('Hide intermediate prices')}
        </Checkbox>
      </Flex>
      <Box overflowX="auto">
        <Table variant="unstyled" size="sm">
          <Thead>
            <Tr>
              <Th textAlign="center">{t('Price')}</Th>
              <Th
                textAlign="center"
                whiteSpace="nowrap"
                cursor="pointer"
                onClick={handleToggleVolume}
                _hover={{ textDecoration: 'underline' }}
              >
                {t('Volume')}
                <Text as="span" fontSize="10px">
                  {' '}
                  (
                  {symbol && toggleVolume === 'quote'
                    ? symbol.quote
                    : symbol && symbol.base}
                  )
                </Text>
              </Th>
              <Th textAlign="center" whiteSpace="nowrap">
                {t('Date')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {prices.map((data) => (
              <HistoryRow
                key={`${data.timestamp}-${data.source || 'auction'}`}
                data={data}
                symbol={symbol}
                toggleVolume={toggleVolume}
                isMerged={!hideIntermediate}
              />
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}

export default PriceHistory
