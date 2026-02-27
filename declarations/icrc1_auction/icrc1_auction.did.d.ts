import type { ActorMethod } from '@icp-sdk/core/agent'
import type { IDL } from '@icp-sdk/core/candid'
import type { Principal } from '@icp-sdk/core/principal'

export interface AuctionQueryResponse {
  last_prices: Array<PriceHistoryItem>
  credits: Array<[Principal, CreditInfo]>
  last_immediate_prices: Array<PriceHistoryItem>
  dark_order_books: Array<[Principal, EncryptedOrderBook]>
  asks: Array<[OrderId, Order]>
  bids: Array<[OrderId, Order]>
  account_revision: bigint
  immediate_order_book_info: Array<[Principal, ImmediateOrderBookInfo]>
  session_numbers: Array<[Principal, bigint]>
  immediate_price_history: Array<PriceHistoryItem>
  order_book_info: Array<[Principal, OrderBookInfo]>
  transaction_history: Array<TransactionHistoryItem>
  price_history: Array<PriceHistoryItem>
  points: bigint
  deposit_history: Array<DepositHistoryItem>
}

export interface AuctionQuerySelection {
  last_prices: [] | [boolean]
  credits: [] | [boolean]
  last_immediate_prices: [] | [boolean]
  dark_order_books: [] | [boolean]
  asks: [] | [boolean]
  bids: [] | [boolean]
  immediate_order_book_info: [] | [boolean]
  session_numbers: [] | [boolean]
  immediate_price_history: [] | [[bigint, bigint]]
  order_book_info: [] | [boolean]
  transaction_history: [] | [[bigint, bigint]]
  reversed_history: [] | [boolean]
  price_history: [] | [[bigint, bigint, boolean]]
  deposit_history: [] | [[bigint, bigint]]
}

export type BtcNotifyResult =
  | {
      Ok: { credit_inc: bigint; credit: bigint; deposit_inc: bigint }
    }
  | {
      Err:
        | {
            GenericError: { error_message: string; error_code: bigint }
          }
        | { NotAvailable: { message: string } }
        | { TemporarilyUnavailable: string }
        | { AlreadyProcessing: null }
        | { NotMinted: null }
        | { CallLedgerError: { message: string } }
        | {
            NoNewUtxos: {
              suspended_utxos: [] | [Array<SuspendedUtxo>]
              required_confirmations: number
              pending_utxos: [] | [Array<PendingUtxo>]
              current_confirmations: [] | [number]
            }
          }
    }
export type BtcWithdrawResult =
  | { Ok: { block_index: bigint } }
  | {
      Err:
        | { MalformedAddress: string }
        | { GenericError: { error_message: string; error_code: bigint } }
        | { TemporarilyUnavailable: unknown }
        | { InsufficientAllowance: { allowance: bigint } }
        | { AlreadyProcessing: null }
        | { Duplicate: { duplicate_of: bigint } }
        | { InsufficientCredit: Record<string, never> }
        | { BadFee: { expected_fee: bigint } }
        | { AmountTooLow: bigint }
        | { AllowanceChanged: { current_allowance: bigint } }
        | { CreatedInFuture: { ledger_time: bigint } }
        | { TooOld: null }
        | { Expired: { ledger_time: bigint } }
        | { InsufficientFunds: { balance: unknown } }
    }
export type CancelOrderError =
  | { UnknownOrder: null }
  | { UnknownPrincipal: null }
  | { AccountRevisionMismatch: null }
export type CancellationResult = [
  OrderId,
  Principal,
  OrderBookType,
  bigint,
  number,
]

export interface CreditInfo {
  total: bigint
  locked: bigint
  available: bigint
}

export interface DepositArgs {
  token: Principal
  from: { owner: Principal; subaccount: [] | [Uint8Array | number[]] }
  amount: bigint
  expected_fee: [] | [bigint]
}

export type DepositHistoryItem = [
  bigint,
  { deposit: null } | { withdrawal: null },
  Principal,
  bigint,
]
export type DepositResponse =
  | {
      Ok: { credit_inc: bigint; txid: bigint; credit: bigint }
    }
  | {
      Err:
        | { TransferError: { message: string } }
        | { AmountBelowMinimum: Record<string, never> }
        | { CallLedgerError: { message: string } }
        | { BadFee: { expected_fee: bigint } }
    }
export type DirectCyclesWithdrawResult =
  | {
      Ok: { txid: bigint; amount: bigint }
    }
  | {
      Err:
        | {
            FailedToWithdraw: {
              rejection_code:
                | { NoError: null }
                | { CanisterError: null }
                | { SysTransient: null }
                | { DestinationInvalid: null }
                | { Unknown: null }
                | { SysFatal: null }
                | { CanisterReject: null }
              fee_block: [] | [bigint]
              rejection_reason: string
            }
          }
        | { GenericError: { error_message: string; error_code: bigint } }
        | { TemporarilyUnavailable: null }
        | { Duplicate: { duplicate_of: bigint } }
        | { InsufficientCredit: Record<string, never> }
        | { BadFee: { expected_fee: bigint } }
        | { InvalidReceiver: { receiver: Principal } }
        | { CreatedInFuture: { ledger_time: bigint } }
        | { TooLowAmount: Record<string, never> }
        | { TooOld: null }
        | { InsufficientFunds: { balance: bigint } }
    }
export type EncryptedOrderBook = [Uint8Array | number[], Uint8Array | number[]]

export interface _SERVICE {
  addAdmin: ActorMethod<[Principal], undefined>
  auction_query: ActorMethod<
    [Array<Principal>, AuctionQuerySelection],
    AuctionQueryResponse
  >
  btc_depositAddress: ActorMethod<[[] | [Principal]], string>
  btc_notify: ActorMethod<[], BtcNotifyResult>
  btc_withdraw: ActorMethod<[{ to: string; amount: bigint }], BtcWithdrawResult>
  btc_withdrawal_status: ActorMethod<
    [{ block_index: bigint }],
    RetrieveBtcStatusV2
  >
  cancelAsks: ActorMethod<[Array<OrderId>, [] | [bigint]], Array<UpperResult_5>>
  cancelBids: ActorMethod<[Array<OrderId>, [] | [bigint]], Array<UpperResult_5>>
  cycles_withdraw: ActorMethod<
    [{ to: Principal; amount: bigint }],
    DirectCyclesWithdrawResult
  >
  getQuoteLedger: ActorMethod<[], Principal>
  getUserSettings: ActorMethod<[], SharedUserSettings>
  icrc84_deposit: ActorMethod<[DepositArgs], DepositResponse>
  icrc84_notify: ActorMethod<[NotifyArgs], NotifyResponse>
  icrc84_query: ActorMethod<
    [Array<Principal>],
    Array<[Principal, { credit: bigint; tracked_deposit: [] | [bigint] }]>
  >
  icrc84_supported_tokens: ActorMethod<[], Array<Principal>>
  icrc84_token_info: ActorMethod<[Principal], TokenInfo>
  icrc84_withdraw: ActorMethod<[WithdrawArgs], WithdrawResponse>
  indicativeStats: ActorMethod<[Principal], OrderBookInfo>
  listAdmins: ActorMethod<[], Array<Principal>>
  manageDarkOrderBooks: ActorMethod<
    [Array<[Principal, [] | [EncryptedOrderBook]]>, [] | [bigint]],
    UpperResult_4
  >
  manageOrders: ActorMethod<
    [
      (
        | []
        | [
            | { all: [] | [Array<Principal>] }
            | { orders: Array<{ ask: OrderId } | { bid: OrderId }> },
          ]
      ),
      Array<
        | { ask: [Principal, OrderBookType, bigint, number] }
        | { bid: [Principal, OrderBookType, bigint, number] }
      >,
      [] | [bigint],
    ],
    UpperResult_3
  >
  nextSession: ActorMethod<[], { counter: bigint; timestamp: bigint }>
  placeAsks: ActorMethod<
    [Array<[Principal, OrderBookType, bigint, number]>, [] | [bigint]],
    Array<UpperResult_2>
  >
  placeBids: ActorMethod<
    [Array<[Principal, OrderBookType, bigint, number]>, [] | [bigint]],
    Array<UpperResult_2>
  >
  principalToSubaccount: ActorMethod<[Principal], [] | [Uint8Array | number[]]>
  queryTokenHandlerNotificationsOnPause: ActorMethod<[Principal], boolean>
  registerAsset: ActorMethod<[Principal, bigint], UpperResult_1>
  removeAdmin: ActorMethod<[Principal], undefined>
  replaceAsk: ActorMethod<[OrderId, bigint, number, [] | [bigint]], UpperResult>
  replaceBid: ActorMethod<[OrderId, bigint, number, [] | [bigint]], UpperResult>
  settings: ActorMethod<
    [],
    {
      orderQuoteVolumeMinimum: bigint
      orderPriceDigitsLimit: bigint
      orderQuoteVolumeStep: bigint
    }
  >
  updateUserSettings: ActorMethod<
    [{ pushNotificationsEnabled: [] | [boolean] }],
    SharedUserSettings
  >
}

export interface ImmediateOrderBookInfo {
  totalAskVolume: bigint
  minAskPrice: [] | [number]
  maxBidPrice: [] | [number]
  totalBidVolume: bigint
}

export type InternalPlaceOrderError =
  | {
      ConflictingOrder: [{ ask: null } | { bid: null }, [] | [OrderId]]
    }
  | { UnknownAsset: null }
  | { NoCredit: null }
  | { VolumeStepViolated: { baseVolumeStep: bigint } }
  | { TooLowOrder: null }
  | { PriceDigitsOverflow: { maxDigits: bigint } }
export type ManageOrdersError =
  | {
      placement: { error: InternalPlaceOrderError; index: bigint }
    }
  | { UnknownPrincipal: null }
  | { AccountRevisionMismatch: null }
  | {
      cancellation: {
        error: { UnknownAsset: null } | { UnknownOrder: null }
        index: bigint
      }
    }

export interface NotifyArgs {
  token: Principal
}

export type NotifyResponse =
  | {
      Ok: { credit_inc: bigint; credit: bigint; deposit_inc: bigint }
    }
  | {
      Err:
        | { NotAvailable: { message: string } }
        | { CallLedgerError: { message: string } }
    }

export interface Order {
  icrc1Ledger: Principal
  volume: bigint
  orderBookType: OrderBookType
  price: number
}

export interface OrderBookInfo {
  clearing: { match: { volume: bigint; price: number } } | { noMatch: null }
  totalAskVolume: bigint
  minAskPrice: [] | [number]
  maxBidPrice: [] | [number]
  totalBidVolume: bigint
}

export type OrderBookType = { delayed: null } | { immediate: null }
export type OrderId = bigint

export interface PendingUtxo {
  confirmations: number
  value: bigint
  outpoint: { txid: Uint8Array | number[]; vout: number }
}

export type PlaceOrderError =
  | {
      ConflictingOrder: [{ ask: null } | { bid: null }, [] | [OrderId]]
    }
  | { UnknownAsset: null }
  | { NoCredit: null }
  | { UnknownPrincipal: null }
  | { VolumeStepViolated: { baseVolumeStep: bigint } }
  | { TooLowOrder: null }
  | { AccountRevisionMismatch: null }
  | { PriceDigitsOverflow: { maxDigits: bigint } }
export type PlaceOrderResult = [
  OrderId,
  { placed: null } | { executed: Array<[number, bigint]> },
]
export type PriceHistoryItem = [bigint, bigint, Principal, bigint, number]
export type RegisterAssetError = { AlreadyRegistered: null }
export type ReimbursementReason =
  | { CallFailed: null }
  | { TaintedDestination: { kyt_fee: bigint; kyt_provider: Principal } }
export type ReplaceOrderError =
  | {
      ConflictingOrder: [{ ask: null } | { bid: null }, [] | [OrderId]]
    }
  | { UnknownAsset: null }
  | { UnknownOrder: null }
  | { NoCredit: null }
  | { UnknownPrincipal: null }
  | { VolumeStepViolated: { baseVolumeStep: bigint } }
  | { TooLowOrder: null }
  | { AccountRevisionMismatch: null }
  | { PriceDigitsOverflow: { maxDigits: bigint } }
export type RetrieveBtcStatusV2 =
  | { Signing: null }
  | { Confirmed: { txid: Uint8Array | number[] } }
  | { Sending: { txid: Uint8Array | number[] } }
  | { AmountTooLow: null }
  | {
      WillReimburse: {
        account: {
          owner: Principal
          subaccount: [] | [Uint8Array | number[]]
        }
        amount: bigint
        reason: ReimbursementReason
      }
    }
  | { Unknown: null }
  | { Submitted: { txid: Uint8Array | number[] } }
  | {
      Reimbursed: {
        account: {
          owner: Principal
          subaccount: [] | [Uint8Array | number[]]
        }
        mint_block_index: bigint
        amount: bigint
        reason: ReimbursementReason
      }
    }
  | { Pending: null }

export interface SharedUserSettings {
  pushNotificationsEnabled: boolean
}

export type SuspendedReason = { ValueTooSmall: null } | { Quarantined: null }

export interface SuspendedUtxo {
  utxo: Utxo
  earliest_retry: bigint
  reason: SuspendedReason
}

export interface TokenInfo {
  allowance_fee: bigint
  withdrawal_fee: bigint
  deposit_fee: bigint
}

export type TransactionHistoryItem = [
  bigint,
  bigint,
  { ask: null } | { bid: null },
  Principal,
  bigint,
  number,
]
export type UpperResult = { Ok: PlaceOrderResult } | { Err: ReplaceOrderError }
export type UpperResult_1 = { Ok: bigint } | { Err: RegisterAssetError }
export type UpperResult_2 = { Ok: PlaceOrderResult } | { Err: PlaceOrderError }
export type UpperResult_3 =
  | {
      Ok: [Array<CancellationResult>, Array<PlaceOrderResult>]
    }
  | { Err: ManageOrdersError }
export type UpperResult_4 =
  | { Ok: Array<[] | [EncryptedOrderBook]> }
  | {
      Err:
        | { UnknownAsset: Principal }
        | { NoCredit: null }
        | { UnknownPrincipal: null }
        | { AccountRevisionMismatch: null }
    }
export type UpperResult_5 =
  | { Ok: CancellationResult }
  | { Err: CancelOrderError }

export interface Utxo {
  height: number
  value: bigint
  outpoint: { txid: Uint8Array | number[]; vout: number }
}

export interface WithdrawArgs {
  to: { owner: Principal; subaccount: [] | [Uint8Array | number[]] }
  token: Principal
  amount: bigint
  expected_fee: [] | [bigint]
}

export type WithdrawResponse =
  | {
      Ok: { txid: bigint; amount: bigint }
    }
  | {
      Err:
        | { AmountBelowMinimum: Record<string, never> }
        | { InsufficientCredit: Record<string, never> }
        | { CallLedgerError: { message: string } }
        | { BadFee: { expected_fee: bigint } }
    }

export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
