import { HttpAgent, AnonymousIdentity } from '@icp-sdk/core/agent'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { AuthState } from '../../types'
import { getAgent } from '../../utils/authUtils'

const anonymousIdentity = getAgent(new AnonymousIdentity())

const initialState: AuthState = {
  userAgent: anonymousIdentity,
  isAuthenticated: false,
  userPrincipal: '',
  userDeposit: '',
  userBtcDepositAddress: '',
  userIcpLegacyAccount: '',
  userDepositCycles: '',
  userPoints: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserAgent: (state, action: PayloadAction<HttpAgent>) => {
      return {
        ...state,
        userAgent: action.payload,
      }
    },
    setIsAuthenticated: (state, action: PayloadAction<boolean>) => {
      return {
        ...state,
        isAuthenticated: action.payload,
      }
    },
    setUserPrincipal: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userPrincipal: action.payload,
      }
    },
    setUserDeposit: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userDeposit: action.payload,
      }
    },
    setUserBtcDepositAddress: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userBtcDepositAddress: action.payload,
      }
    },
    setUserIcpLegacyAccount: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userIcpLegacyAccount: action.payload,
      }
    },
    setUserDepositCycles: (state, action: PayloadAction<string>) => {
      return {
        ...state,
        userDepositCycles: action.payload,
      }
    },
    setUserPoints: (state, action: PayloadAction<number | null>) => {
      return {
        ...state,
        userPoints: action.payload,
      }
    },
    logout: (state) => {
      return {
        ...state,
        userAgent: anonymousIdentity,
        isAuthenticated: false,
        userPrincipal: '',
        userDeposit: '',
        userBtcDepositAddress: '',
        userIcpLegacyAccount: '',
        userDepositCycles: '',
        userPoints: null,
      }
    },
  },
})

export const {
  setUserAgent,
  setIsAuthenticated,
  setUserPrincipal,
  setUserDeposit,
  setUserBtcDepositAddress,
  setUserIcpLegacyAccount,
  setUserDepositCycles,
  setUserPoints,
  logout,
} = authSlice.actions
export default authSlice.reducer
