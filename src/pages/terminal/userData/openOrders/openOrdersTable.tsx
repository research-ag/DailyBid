import { MouseEventHandler } from 'react'

import { CloseIcon } from '@chakra-ui/icons'
import {
  Flex,
  Image,
  Text,
  IconButton,
  Spinner,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiEdit3 } from 'react-icons/fi'
import { Row } from 'react-table'

import { ColumnWithSorting } from '../../../../components/paginationTable'
import { TokenDataItem } from '../../../../types'
import { getMinimumFractionDigits } from '../../../../utils/calculationsUtils'

export default function tableContent(
  toggleVolume: string,
  handleToggleVolume: MouseEventHandler<HTMLParagraphElement> | undefined,
  handleReplace: (
    id: bigint | undefined,
    base: string | undefined,
    volumeInBase: number | undefined,
    volumeInQuote: number | undefined,
    price: number | undefined,
    type: string | undefined,
  ) => void,
  handleCancel: (id: bigint | undefined, type: string | undefined) => void,
) {
  const bgColor = useColorModeValue('grey.200', 'grey.700')
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
        const {
          id,
          base,
          volumeInBase,
          volumeInQuote,
          price,
          priceDigitsLimit,
          type,
          loading,
          replacing,
        } = row.original

        const fixedPrice = price.toLocaleString('en-US', {
          minimumFractionDigits: getMinimumFractionDigits(
            String(price),
            Number(priceDigitsLimit),
          ),
          maximumFractionDigits: priceDigitsLimit,
          useGrouping: false,
        })

        return (
          <Flex justifyContent="center" alignItems="center">
            <IconButton
              aria-label="Edit Order"
              icon={<FiEdit3 />}
              onClick={() =>
                handleReplace(
                  id,
                  base,
                  Number(volumeInBase),
                  Number(volumeInQuote),
                  Number(fixedPrice),
                  type,
                )
              }
              variant="ghost"
              size="xs"
              bg={
                replacing
                  ? type === 'buy'
                    ? 'green.500'
                    : 'red.500'
                  : undefined
              }
              _hover={{
                bg: replacing
                  ? type === 'buy'
                    ? 'green.500'
                    : 'red.400'
                  : bgColor,
              }}
              _active={{
                bg: replacing
                  ? type === 'buy'
                    ? 'green.500'
                    : 'red.400'
                  : bgColor,
              }}
            />
            <IconButton
              aria-label="Cancel Order"
              icon={loading ? <Spinner size="xs" /> : <CloseIcon />}
              onClick={() => handleCancel(id, type)}
              variant="ghost"
              size="xs"
              _hover={{
                bg: bgColor,
              }}
              _active={{
                bg: bgColor,
              }}
            />
          </Flex>
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

  const sortBy: any[] = []

  return { tableColumns, hiddenColumns, sortBy }
}
