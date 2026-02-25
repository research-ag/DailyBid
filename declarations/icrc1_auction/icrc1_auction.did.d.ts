import type { ActorMethod } from '@icp-sdk/core/agent'
import type { IDL } from '@icp-sdk/core/candid'
import type { Principal } from '@icp-sdk/core/principal'

export interface Account {
  owner: Principal
  subaccount: [] | [Subaccount]
}

export type AccountRevision = bigint
export type Amount = bigint
export type CancelOrderResponse =
  | {
      Ok: [OrderId, Token, OrderBookType, bigint, number]
    }
  | {
      Err:
        | { UnknownOrder: null }
        | { UnknownPrincipal: null }
        | { AccountRevisionMismatch: null }
    }
export type CancellationArg =
  | { all: [] | [Array<Token>] }
  | { orders: Array<{ ask: OrderId } | { bid: OrderId }> }

export interface DepositArgs {
  token: Token
  from: Account
  amount: Amount
  expected_fee: [] | [bigint]
}

export type DepositResponse =
  | { Ok: DepositResult }
  | {
      Err:
        | { TransferError: { message: string } }
        | { AmountBelowMinimum: Record<string, never> }
        | { CallLedgerError: { message: string } }
        | { BadFee: { expected_fee: bigint } }
    }

export interface DepositResult {
  credit_inc: Amount
  txid: bigint
  credit: bigint
}

export type EncryptedOrderBook = [Uint8Array | number[], Uint8Array | number[]]

export interface ImmediateOrderBookInfo {
  totalAskVolume: bigint
  minAskPrice: [] | [number]
  maxBidPrice: [] | [number]
  totalBidVolume: bigint
}

export type ManageOrdersResponse =
  | {
      Ok: [
        Array<[OrderId, Token, OrderBookType, bigint, number]>,
        Array<
          [OrderId, { placed: null } | { executed: Array<[number, bigint]> }]
        >,
      ]
    }
  | {
      Err:
        | {
            placement: {
              error:
                | {
                    ConflictingOrder: [
                      { ask: null } | { bid: null },
                      [] | [OrderId],
                    ]
                  }
                | { UnknownAsset: null }
                | { NoCredit: null }
                | { VolumeStepViolated: { baseVolumeStep: bigint } }
                | { TooLowOrder: null }
                | { PriceDigitsOverflow: { maxDigits: bigint } }
              index: bigint
            }
          }
        | { UnknownPrincipal: null }
        | { AccountRevisionMismatch: null }
        | {
            cancellation: {
              error: { UnknownAsset: null } | { UnknownOrder: null }
              index: bigint
            }
          }
    }

export interface NotifyArg {
  token: Token
}

export type NotifyResponse =
  | { Ok: NotifyResult }
  | {
      Err:
        | { NotAvailable: { message: string } }
        | { CallLedgerError: { message: string } }
    }

export interface NotifyResult {
  credit_inc: Amount
  credit: bigint
  deposit_inc: Amount
}

export interface Order {
  icrc1Ledger: Token
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
export type PlaceArg = Array<
  | { ask: [Token, OrderBookType, bigint, number] }
  | { bid: [Token, OrderBookType, bigint, number] }
>
export type PlaceOrderResponse =
  | {
      Ok: [OrderId, { placed: null } | { executed: Array<[number, bigint]> }]
    }
  | {
      Err:
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
    }
export type ReplaceOrderResponse =
  | {
      Ok: [OrderId, { placed: null } | { executed: Array<[number, bigint]> }]
    }
  | {
      Err:
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
    }
export type SessionNumber = bigint
export type Subaccount = Uint8Array | number[]
export type Token = Principal

export interface TokenInfo {
  allowance_fee: Amount
  withdrawal_fee: Amount
  deposit_fee: Amount
}

export interface WithdrawArgs {
  to: Account
  token: Token
  amount: Amount
  expected_fee: [] | [bigint]
}

export type WithdrawResponse =
  | {
      Ok: { txid: bigint; amount: Amount }
    }
  | {
      Err:
        | { AmountBelowMinimum: Record<string, never> }
        | { InsufficientCredit: Record<string, never> }
        | { CallLedgerError: { message: string } }
        | { BadFee: { expected_fee: bigint } }
    }

export interface _SERVICE {
  addAdmin: ActorMethod<[Principal], undefined>
  auction_query: ActorMethod<
    [
      Array<Token>,
      {
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
      },
    ],
    {
      last_prices: Array<[bigint, bigint, Token, bigint, number]>
      credits: Array<
        [Token, { total: bigint; locked: bigint; available: bigint }]
      >
      last_immediate_prices: Array<[bigint, bigint, Token, bigint, number]>
      dark_order_books: Array<[Token, EncryptedOrderBook]>
      asks: Array<[OrderId, Order]>
      bids: Array<[OrderId, Order]>
      account_revision: bigint
      immediate_order_book_info: Array<[Token, ImmediateOrderBookInfo]>
      session_numbers: Array<[Token, SessionNumber]>
      immediate_price_history: Array<[bigint, bigint, Token, bigint, number]>
      order_book_info: Array<[Token, OrderBookInfo]>
      transaction_history: Array<
        [bigint, bigint, { ask: null } | { bid: null }, Token, bigint, number]
      >
      price_history: Array<[bigint, bigint, Token, bigint, number]>
      points: bigint
      deposit_history: Array<
        [bigint, { deposit: null } | { withdrawal: null }, Token, bigint]
      >
    }
  >
  btc_depositAddress: ActorMethod<[[] | [Principal]], string>
  btc_notify: ActorMethod<
    [],
    | {
        Ok: {
          credit_inc: bigint
          credit: bigint
          deposit_inc: bigint
        }
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
                suspended_utxos:
                  | []
                  | [
                      Array<{
                        utxo: {
                          height: number
                          value: bigint
                          outpoint: {
                            txid: Uint8Array | number[]
                            vout: number
                          }
                        }
                        earliest_retry: bigint
                        reason: { ValueTooSmall: null } | { Quarantined: null }
                      }>,
                    ]
                required_confirmations: number
                pending_utxos:
                  | []
                  | [
                      Array<{
                        confirmations: number
                        value: bigint
                        outpoint: {
                          txid: Uint8Array | number[]
                          vout: number
                        }
                      }>,
                    ]
                current_confirmations: [] | [number]
              }
            }
      }
  >
  btc_withdraw: ActorMethod<
    [{ to: string; amount: bigint }],
    | { Ok: { block_index: bigint } }
    | {
        Err:
          | { MalformedAddress: string }
          | {
              GenericError: { error_message: string; error_code: bigint }
            }
          | { TemporarilyUnavailable: any }
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
          | { InsufficientFunds: { balance: any } }
      }
  >
  btc_withdrawal_status: ActorMethod<
    [{ block_index: bigint }],
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
          reason:
            | { CallFailed: null }
            | {
                TaintedDestination: {
                  kyt_fee: bigint
                  kyt_provider: Principal
                }
              }
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
          reason:
            | { CallFailed: null }
            | {
                TaintedDestination: {
                  kyt_fee: bigint
                  kyt_provider: Principal
                }
              }
        }
      }
    | { Pending: null }
  >
  cancelAsks: ActorMethod<
    [Array<OrderId>, [] | [AccountRevision]],
    Array<CancelOrderResponse>
  >
  cancelBids: ActorMethod<
    [Array<OrderId>, [] | [AccountRevision]],
    Array<CancelOrderResponse>
  >
  cycles_withdraw: ActorMethod<
    [{ to: Principal; amount: bigint }],
    | { Ok: { txid: bigint; amount: bigint } }
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
          | {
              GenericError: { error_message: string; error_code: bigint }
            }
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
  >
  getQuoteLedger: ActorMethod<[], Principal>
  icrc84_deposit: ActorMethod<[DepositArgs], DepositResponse>
  icrc84_notify: ActorMethod<[NotifyArg], NotifyResponse>
  icrc84_query: ActorMethod<
    [Array<Token>],
    Array<[Token, { credit: bigint; tracked_deposit: [] | [Amount] }]>
  >
  icrc84_supported_tokens: ActorMethod<[], Array<Token>>
  icrc84_token_info: ActorMethod<[Token], TokenInfo>
  icrc84_withdraw: ActorMethod<[WithdrawArgs], WithdrawResponse>
  indicativeStats: ActorMethod<[Principal], OrderBookInfo>
  listAdmins: ActorMethod<[], Array<Principal>>
  manageDarkOrderBooks: ActorMethod<
    [Array<[Principal, [] | [EncryptedOrderBook]]>, [] | [bigint]],
    | { Ok: Array<[] | [EncryptedOrderBook]> }
    | {
        Err:
          | { UnknownAsset: Principal }
          | { NoCredit: null }
          | { UnknownPrincipal: null }
          | { AccountRevisionMismatch: null }
      }
  >
  manageOrders: ActorMethod<
    [[] | [CancellationArg], PlaceArg, [] | [AccountRevision]],
    ManageOrdersResponse
  >
  nextSession: ActorMethod<[], { counter: bigint; timestamp: bigint }>
  placeAsks: ActorMethod<
    [Array<[Token, OrderBookType, bigint, number]>, [] | [AccountRevision]],
    Array<PlaceOrderResponse>
  >
  placeBids: ActorMethod<
    [Array<[Token, OrderBookType, bigint, number]>, [] | [AccountRevision]],
    Array<PlaceOrderResponse>
  >
  principalToSubaccount: ActorMethod<[Principal], [] | [Uint8Array | number[]]>
  registerAsset: ActorMethod<
    [Principal, bigint],
    { Ok: bigint } | { Err: { AlreadyRegistered: null } }
  >
  removeAdmin: ActorMethod<[Principal], undefined>
  replaceAsk: ActorMethod<
    [OrderId, bigint, number, [] | [AccountRevision]],
    ReplaceOrderResponse
  >
  replaceBid: ActorMethod<
    [OrderId, bigint, number, [] | [AccountRevision]],
    ReplaceOrderResponse
  >
  settings: ActorMethod<
    [],
    {
      orderQuoteVolumeMinimum: bigint
      orderPriceDigitsLimit: bigint
      orderQuoteVolumeStep: bigint
    }
  >
}

export declare const idlFactory: IDL.InterfaceFactory
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[]
