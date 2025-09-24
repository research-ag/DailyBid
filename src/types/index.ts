import { HttpAgent } from '@dfinity/agent'
import { Option as OptionBymax } from 'bymax-react-select'

export interface Language {
  [key: string]: string
}
export interface Option extends OptionBymax {
  decimals?: number
  principal?: string
  lastAuction?: number
  previousChange?: number
  periodVolume?: number
}
export interface HeaderInformation {
  currentBidAsk: [number | null, number | null]
  previousChange: {
    amount: number | string
    percentage: number | string
  }
  periodVolume: number | string
  priceDigitsLimit: number
}
export interface DataItem {
  id?: bigint
  datetime: string
  date?: string
  time?: string
  price: number
  type?: string
  volume: number
  volumeInBase: number
  volumeInQuote: number
  volumeInAvailable?: number
  volumeInAvailableNat?: string
  volumeInLocked?: number
  volumeInLockedNat?: string
  volumeInTotal?: number
  volumeInTotalNat?: string
  priceDecimals?: number
  volumeDecimals?: number
  baseDecimals?: number
  quoteDecimals?: number
  volumeInBaseDecimals?: number
  volumeInQuoteDecimals?: number
  priceDigitsLimit?: number
}
export interface TokenMetadata {
  symbol: string
  name: string
  decimals: number
  logo: string
  fee: string
  quote: string
  base: string
  principal?: string
}
export interface TokenApi {
  symbol: string
  name: string
  timestamp: bigint
  value: number
}
export interface TokensState {
  tokens: TokenMetadata[] | []
  selectedSymbol: Option | Option[] | null
  selectedQuote: TokenMetadata
}
export interface PricesState {
  isRefreshPrices: boolean
  headerInformation: HeaderInformation | null
  nextSession: string | null
  pricesHistory: DataItem[] | []
  pricesInfo: TokenApi[] | []
}
export interface TokenDataItem extends DataItem, TokenMetadata {
  [key: string]: any
}
export interface ClaimTokenBalance {
  principal: string
  base: string
  available: number
}
export interface AuthState {
  userAgent: HttpAgent
  isAuthenticated: boolean
  userPrincipal: string
  userDeposit: string
  userBtcDepositAddress: string
  userIcpLegacyAccount: string
  userDepositCycles: string
  userPoints: number | null
}
export interface OpenOrdersState {
  isRefreshUserData: boolean
  orderSettings: SettingsState
  orderDetails: Order
  openOrders: TokenDataItem[] | []
}
export interface TradesState {
  trades: TokenDataItem[] | []
}
export interface ActionsState {
  actions: TokenDataItem[] | []
}
export interface BalancesState {
  isRefreshBalances: boolean
  isWithdrawStarted: boolean
  balances: TokenDataItem[] | []
}
export interface SettingsState {
  orderQuoteVolumeMinimum: number
  orderQuoteVolumeMinimumNat: string
  orderPriceDigitsLimit: number
  orderPriceDigitsLimitNat: string
  orderQuoteVolumeStep: number
  orderQuoteVolumeStepNat: string
}
export interface Result {
  Ok?: any
  Err?: any
  [key: string]: any
}
export interface Order {
  id: bigint
  base?: string
  volumeInBase: bigint
  volumeInQuote?: bigint
  price: number
  type: string
}
export interface Statistics {
  clearingPrice?: number | null
  clearingVolume?: number | null
  minAskPrice?: number | null
  maxBidPrice?: number | null
  totalAskVolume: number | null
  totalBidVolume: number | null
}
export interface NextSession {
  nextSession: string
  datetime: number
  counter: string
}
export interface NewBtcUtxo {
  amount: number
  height: number
  block_time: number
  confirmations: number
  txid: string
}
