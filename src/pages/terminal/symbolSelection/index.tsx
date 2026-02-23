import React, { useMemo, useState, useEffect, useCallback } from 'react'

import { Box } from '@chakra-ui/react'
import { Select } from 'bymax-react-select'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'

import customStyles from '../../../common/styles'
import useTokens from '../../../hooks/useTokens'
import { RootState, AppDispatch } from '../../../store'
import {
  setTokens,
  setSelectedSymbol,
  setSelectedQuote,
} from '../../../store/tokens'
import { Option } from '../../../types'

const SymbolSelection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const { userAgent } = useSelector((state: RootState) => state.auth)
  const tokens = useSelector((state: RootState) => state.tokens.tokens)
  const quoteTokenDefault = process.env.ENV_TOKEN_QUOTE_DEFAULT || 'USDT'
  const tokenDefault = process.env.ENV_TOKEN_SELECTED_DEFAULT
  const selectedSymbol = useSelector(
    (state: RootState) => state.tokens.selectedSymbol,
  )
  const selectedQuote = useSelector(
    (state: RootState) => state.tokens.selectedQuote,
  )

  const fetchTokens = useCallback(async () => {
    setLoading(true)

    const { getTokens } = useTokens()
    const data = await getTokens(userAgent)

    const quoteToken = data.tokens.find(
      (token) => token.symbol === (data?.quoteToken?.base || quoteTokenDefault),
    )

    dispatch(setTokens(data.tokens))

    if (quoteToken) {
      dispatch(setSelectedQuote(quoteToken))
    }

    setLoading(false)
  }, [])

  const filteredTokens = useMemo(
    () =>
      tokens.filter(
        (token) => token.symbol !== (selectedQuote?.base || quoteTokenDefault),
      ),
    [tokens, selectedQuote, quoteTokenDefault],
  )

  const options: Option[] = useMemo(
    () =>
      filteredTokens.map((token) => ({
        id: token.symbol,
        value: token.symbol,
        label: token.name,
        image: token.logo || '',
        base: token.base,
        quote: token.quote,
        decimals: token.decimals,
        principal: token.principal,
      })),
    [filteredTokens],
  )

  const handleChange = (option: Option | Option[] | null) => {
    dispatch(setSelectedSymbol(option))
  }

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  useEffect(() => {
    if (filteredTokens.length > 0) {
      let initialSymbol = filteredTokens.find(
        (token) => token.base === tokenDefault,
      )
      initialSymbol =
        initialSymbol && initialSymbol?.base === tokenDefault
          ? initialSymbol
          : filteredTokens[0]
      const initialOption: Option = {
        id: initialSymbol.symbol,
        value: initialSymbol.symbol,
        label: initialSymbol.name,
        image: initialSymbol.logo,
        base: initialSymbol.base,
        quote: initialSymbol.quote,
        decimals: initialSymbol.decimals,
        principal: initialSymbol.principal,
      }
      dispatch(setSelectedSymbol(initialOption))
    } else {
      dispatch(setSelectedSymbol(null))
    }
  }, [dispatch, tokenDefault, filteredTokens])

  return (
    <Box w="100%" zIndex="9">
      <Select
        id="symbols"
        value={selectedSymbol}
        isMulti={false}
        isClearable={false}
        options={options}
        placeholder={loading ? t('Loading...') : t('Select a symbol')}
        placeholderSearch={t('Search for a symbol')}
        moveSelectedToTop={true}
        noOptionsMessage={t('No symbols found')}
        isLoading={loading}
        loadingMessage={t('Loading...')}
        onChange={handleChange}
        styles={customStyles as any}
      />
    </Box>
  )
}

export default SymbolSelection
