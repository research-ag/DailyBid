import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { TokenMetadata, TokensState, Option } from '../../types'

const initialState: TokensState = {
  tokens: [],
  selectedSymbol: null,
  selectedQuote: {
    decimals: 6,
    fee: 0,
    feeNat: '0',
    logo: '',
    name: 'USDT',
    symbol: 'USDT',
    quote: 'USDT',
    base: 'USDT',
  },
}

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<TokenMetadata[] | []>) => {
      state.tokens = action.payload
    },
    setSelectedSymbol: (
      state,
      action: PayloadAction<Option | Option[] | null>,
    ) => {
      state.selectedSymbol = action.payload
    },
    setSelectedQuote: (state, action: PayloadAction<TokenMetadata>) => {
      state.selectedQuote = action.payload
    },
  },
})

export const { setTokens, setSelectedSymbol, setSelectedQuote } =
  tokensSlice.actions

export default tokensSlice.reducer
