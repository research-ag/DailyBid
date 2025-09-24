import React from 'react'

import { Td, Tr, Text, Tooltip } from '@chakra-ui/react'

import { DataItem, Option } from '../../../../types'
import { getMinimumFractionDigits } from '../../../../utils/calculationsUtils'
interface HistoryRowProps {
  data: DataItem
  symbol: Option | null
  toggleVolume: string
  isMerged: boolean
}

const HistoryRow: React.FC<HistoryRowProps> = ({
  data,
  symbol,
  toggleVolume,
  isMerged,
}) => {
  const volumeInBase = data.volumeInBase.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: data.volumeInBaseDecimals,
  })

  const volumeQuoteAllDecimals = data.volumeInQuote.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: data.quoteDecimals,
  })

  const volumeQuoteDecimals = data.volumeInQuote.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: data.volumeInQuoteDecimals,
  })
  return (
    <Tr
      key={data.id}
      fontWeight={isMerged && data.source === 'auction' ? 'bold' : 'normal'}
    >
      <Td textAlign="center">
        {data.price.toLocaleString('en-US', {
          minimumFractionDigits: getMinimumFractionDigits(
            String(data.price),
            Number(data.priceDigitsLimit),
          ),
          maximumFractionDigits: data.priceDigitsLimit,
        })}
      </Td>
      <Td textAlign="center">
        {toggleVolume === 'quote' ? (
          <Tooltip
            label={`${volumeQuoteAllDecimals} ${symbol?.quote}`}
            aria-label="Quote value"
          >
            <Text as="span">{volumeQuoteDecimals} </Text>
          </Tooltip>
        ) : (
          <Tooltip
            label={`${volumeInBase} ${symbol?.base}`}
            aria-label="Base value"
          >
            <Text as="span">{volumeInBase}</Text>
          </Tooltip>
        )}
      </Td>
      <Td textAlign="center" whiteSpace="nowrap">
        <Text fontSize="14px">{data.date}</Text>
        <Text fontSize="11px" color="grey.400">
          {data.time}
        </Text>
      </Td>
    </Tr>
  )
}

export default HistoryRow
