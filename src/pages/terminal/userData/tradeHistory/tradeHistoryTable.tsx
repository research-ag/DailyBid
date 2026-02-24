import { MouseEventHandler } from 'react'

import { Flex, Image, Text, HStack, Tooltip } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Row } from 'react-table'

import { ColumnWithSorting } from '../../../../components/paginationTable'
import { TokenDataItem } from '../../../../types'
import { getMinimumFractionDigits } from '../../../../utils/calculationsUtils'

export default function tableContent(
  toggleVolume: string,
  handleToggleVolume: MouseEventHandler<HTMLParagraphElement> | undefined,
) {
  const { t } = useTranslation()
  const tableColumns: ColumnWithSorting<TokenDataItem>[] = [
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
            {type}
          </Text>
        )
      },
    },
    {
      Header: t('Type'),
      accessor: 'typeOrder',
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { typeOrder } = row.original
        return <Text textAlign="center">{typeOrder}</Text>
      },
    },
    {
      Header: t('Price'),
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
          quoteDecimals,
          volumeInQuote,
          volumeInBase,
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
      Header: t('Date'),
      accessor: 'datetime',
      sortType: (rowA, rowB, columnId) => {
        const dateA = new Date(rowA.values[columnId])
        const dateB = new Date(rowB.values[columnId])

        if (dateA < dateB) {
          return -1
        } else if (dateA > dateB) {
          return 1
        } else {
          return 0
        }
      },
      Cell: ({ row }: { row: Row<TokenDataItem> }) => {
        const { date, time } = row.original
        return (
          <HStack
            justifyContent="flex-end"
            w="95%"
            textAlign="right"
            whiteSpace="nowrap"
          >
            <Text fontSize="13px" w="100%" textAlign="right">
              {`${date}, ${time}`}
            </Text>
          </HStack>
        )
      },
    },
    {
      accessor: 'base',
    },
    {
      accessor: 'quote',
    },
  ]

  const hiddenColumns: string[] = ['base', 'quote']

  const sortBy = [{ id: 'datetime', desc: true }]

  return { tableColumns, hiddenColumns, sortBy }
}
