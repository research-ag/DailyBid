export const idlFactory = ({ IDL }) => {
  const Token = IDL.Principal
  const EncryptedOrderBook = IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Nat8))
  const OrderId = IDL.Nat
  const OrderBookType = IDL.Variant({
    delayed: IDL.Null,
    immediate: IDL.Null,
  })
  const Order = IDL.Record({
    icrc1Ledger: Token,
    volume: IDL.Nat,
    orderBookType: OrderBookType,
    price: IDL.Float64,
  })
  const ImmediateOrderBookInfo = IDL.Record({
    totalAskVolume: IDL.Nat,
    minAskPrice: IDL.Opt(IDL.Float64),
    maxBidPrice: IDL.Opt(IDL.Float64),
    totalBidVolume: IDL.Nat,
  })
  const SessionNumber = IDL.Nat
  const OrderBookInfo = IDL.Record({
    clearing: IDL.Variant({
      match: IDL.Record({ volume: IDL.Nat, price: IDL.Float64 }),
      noMatch: IDL.Record({
        minAskPrice: IDL.Opt(IDL.Float64),
        maxBidPrice: IDL.Opt(IDL.Float64),
      }),
    }),
    totalAskVolume: IDL.Nat,
    totalBidVolume: IDL.Nat,
  })
  const AccountRevision = IDL.Nat
  const CancelOrderResponse = IDL.Variant({
    Ok: IDL.Tuple(OrderId, Token, OrderBookType, IDL.Nat, IDL.Float64),
    Err: IDL.Variant({
      UnknownOrder: IDL.Null,
      UnknownPrincipal: IDL.Null,
      AccountRevisionMismatch: IDL.Null,
    }),
  })
  const Subaccount = IDL.Vec(IDL.Nat8)
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(Subaccount),
  })
  const Amount = IDL.Nat
  const DepositArgs = IDL.Record({
    token: Token,
    from: Account,
    amount: Amount,
    expected_fee: IDL.Opt(IDL.Nat),
  })
  const DepositResult = IDL.Record({
    credit_inc: Amount,
    txid: IDL.Nat,
    credit: IDL.Int,
  })
  const DepositResponse = IDL.Variant({
    Ok: DepositResult,
    Err: IDL.Variant({
      TransferError: IDL.Record({ message: IDL.Text }),
      AmountBelowMinimum: IDL.Record({}),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    }),
  })
  const NotifyArg = IDL.Record({ token: Token })
  const NotifyResult = IDL.Record({
    credit_inc: Amount,
    credit: IDL.Int,
    deposit_inc: Amount,
  })
  const NotifyResponse = IDL.Variant({
    Ok: NotifyResult,
    Err: IDL.Variant({
      NotAvailable: IDL.Record({ message: IDL.Text }),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
    }),
  })
  const TokenInfo = IDL.Record({
    allowance_fee: Amount,
    withdrawal_fee: Amount,
    deposit_fee: Amount,
  })
  const WithdrawArgs = IDL.Record({
    to: Account,
    token: Token,
    amount: Amount,
    expected_fee: IDL.Opt(IDL.Nat),
  })
  const WithdrawResponse = IDL.Variant({
    Ok: IDL.Record({ txid: IDL.Nat, amount: Amount }),
    Err: IDL.Variant({
      AmountBelowMinimum: IDL.Record({}),
      InsufficientCredit: IDL.Record({}),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    }),
  })
  const CancellationArg = IDL.Variant({
    all: IDL.Opt(IDL.Vec(Token)),
    orders: IDL.Vec(IDL.Variant({ ask: OrderId, bid: OrderId })),
  })
  const PlaceArg = IDL.Vec(
    IDL.Variant({
      ask: IDL.Tuple(Token, OrderBookType, IDL.Nat, IDL.Float64),
      bid: IDL.Tuple(Token, OrderBookType, IDL.Nat, IDL.Float64),
    }),
  )
  const ManageOrdersResponse = IDL.Variant({
    Ok: IDL.Tuple(
      IDL.Vec(IDL.Tuple(OrderId, Token, OrderBookType, IDL.Nat, IDL.Float64)),
      IDL.Vec(
        IDL.Tuple(
          OrderId,
          IDL.Variant({
            placed: IDL.Null,
            executed: IDL.Vec(IDL.Tuple(IDL.Float64, IDL.Nat)),
          }),
        ),
      ),
    ),
    Err: IDL.Variant({
      placement: IDL.Record({
        error: IDL.Variant({
          ConflictingOrder: IDL.Tuple(
            IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
            IDL.Opt(OrderId),
          ),
          UnknownAsset: IDL.Null,
          NoCredit: IDL.Null,
          VolumeStepViolated: IDL.Record({ baseVolumeStep: IDL.Nat }),
          TooLowOrder: IDL.Null,
          PriceDigitsOverflow: IDL.Record({ maxDigits: IDL.Nat }),
        }),
        index: IDL.Nat,
      }),
      UnknownPrincipal: IDL.Null,
      AccountRevisionMismatch: IDL.Null,
      cancellation: IDL.Record({
        error: IDL.Variant({
          UnknownAsset: IDL.Null,
          UnknownOrder: IDL.Null,
        }),
        index: IDL.Nat,
      }),
    }),
  })
  const PlaceOrderResponse = IDL.Variant({
    Ok: IDL.Tuple(
      OrderId,
      IDL.Variant({
        placed: IDL.Null,
        executed: IDL.Vec(IDL.Tuple(IDL.Float64, IDL.Nat)),
      }),
    ),
    Err: IDL.Variant({
      ConflictingOrder: IDL.Tuple(
        IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
        IDL.Opt(OrderId),
      ),
      UnknownAsset: IDL.Null,
      NoCredit: IDL.Null,
      UnknownPrincipal: IDL.Null,
      VolumeStepViolated: IDL.Record({ baseVolumeStep: IDL.Nat }),
      TooLowOrder: IDL.Null,
      AccountRevisionMismatch: IDL.Null,
      PriceDigitsOverflow: IDL.Record({ maxDigits: IDL.Nat }),
    }),
  })
  const ReplaceOrderResponse = IDL.Variant({
    Ok: IDL.Tuple(
      OrderId,
      IDL.Variant({
        placed: IDL.Null,
        executed: IDL.Vec(IDL.Tuple(IDL.Float64, IDL.Nat)),
      }),
    ),
    Err: IDL.Variant({
      ConflictingOrder: IDL.Tuple(
        IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
        IDL.Opt(OrderId),
      ),
      UnknownAsset: IDL.Null,
      UnknownOrder: IDL.Null,
      NoCredit: IDL.Null,
      UnknownPrincipal: IDL.Null,
      VolumeStepViolated: IDL.Record({ baseVolumeStep: IDL.Nat }),
      TooLowOrder: IDL.Null,
      AccountRevisionMismatch: IDL.Null,
      PriceDigitsOverflow: IDL.Record({ maxDigits: IDL.Nat }),
    }),
  })
  return IDL.Service({
    addAdmin: IDL.Func([IDL.Principal], [], []),
    auction_query: IDL.Func(
      [
        IDL.Vec(Token),
        IDL.Record({
          last_prices: IDL.Opt(IDL.Bool),
          credits: IDL.Opt(IDL.Bool),
          last_immediate_prices: IDL.Opt(IDL.Bool),
          dark_order_books: IDL.Opt(IDL.Bool),
          asks: IDL.Opt(IDL.Bool),
          bids: IDL.Opt(IDL.Bool),
          immediate_order_book_info: IDL.Opt(IDL.Bool),
          session_numbers: IDL.Opt(IDL.Bool),
          immediate_price_history: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
          order_book_info: IDL.Opt(IDL.Bool),
          transaction_history: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
          reversed_history: IDL.Opt(IDL.Bool),
          price_history: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat, IDL.Bool)),
          deposit_history: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
        }),
      ],
      [
        IDL.Record({
          last_prices: IDL.Vec(
            IDL.Tuple(IDL.Nat64, IDL.Nat, Token, IDL.Nat, IDL.Float64),
          ),
          credits: IDL.Vec(
            IDL.Tuple(
              Token,
              IDL.Record({
                total: IDL.Nat,
                locked: IDL.Nat,
                available: IDL.Nat,
              }),
            ),
          ),
          last_immediate_prices: IDL.Vec(
            IDL.Tuple(IDL.Nat64, IDL.Nat, Token, IDL.Nat, IDL.Float64),
          ),
          dark_order_books: IDL.Vec(IDL.Tuple(Token, EncryptedOrderBook)),
          asks: IDL.Vec(IDL.Tuple(OrderId, Order)),
          bids: IDL.Vec(IDL.Tuple(OrderId, Order)),
          account_revision: IDL.Nat,
          immediate_order_book_info: IDL.Vec(
            IDL.Tuple(Token, ImmediateOrderBookInfo),
          ),
          session_numbers: IDL.Vec(IDL.Tuple(Token, SessionNumber)),
          immediate_price_history: IDL.Vec(
            IDL.Tuple(IDL.Nat64, IDL.Nat, Token, IDL.Nat, IDL.Float64),
          ),
          order_book_info: IDL.Vec(IDL.Tuple(Token, OrderBookInfo)),
          transaction_history: IDL.Vec(
            IDL.Tuple(
              IDL.Nat64,
              IDL.Nat,
              IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
              Token,
              IDL.Nat,
              IDL.Float64,
            ),
          ),
          price_history: IDL.Vec(
            IDL.Tuple(IDL.Nat64, IDL.Nat, Token, IDL.Nat, IDL.Float64),
          ),
          points: IDL.Nat,
          deposit_history: IDL.Vec(
            IDL.Tuple(
              IDL.Nat64,
              IDL.Variant({ deposit: IDL.Null, withdrawal: IDL.Null }),
              Token,
              IDL.Nat,
            ),
          ),
        }),
      ],
      ['query'],
    ),
    btc_depositAddress: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [IDL.Text],
      ['query'],
    ),
    btc_notify: IDL.Func(
      [],
      [
        IDL.Variant({
          Ok: IDL.Record({
            credit_inc: IDL.Nat,
            credit: IDL.Int,
            deposit_inc: IDL.Nat,
          }),
          Err: IDL.Variant({
            GenericError: IDL.Record({
              error_message: IDL.Text,
              error_code: IDL.Nat64,
            }),
            NotAvailable: IDL.Record({ message: IDL.Text }),
            TemporarilyUnavailable: IDL.Text,
            AlreadyProcessing: IDL.Null,
            NotMinted: IDL.Null,
            CallLedgerError: IDL.Record({ message: IDL.Text }),
            NoNewUtxos: IDL.Record({
              suspended_utxos: IDL.Opt(
                IDL.Vec(
                  IDL.Record({
                    utxo: IDL.Record({
                      height: IDL.Nat32,
                      value: IDL.Nat64,
                      outpoint: IDL.Record({
                        txid: IDL.Vec(IDL.Nat8),
                        vout: IDL.Nat32,
                      }),
                    }),
                    earliest_retry: IDL.Nat64,
                    reason: IDL.Variant({
                      ValueTooSmall: IDL.Null,
                      Quarantined: IDL.Null,
                    }),
                  }),
                ),
              ),
              required_confirmations: IDL.Nat32,
              pending_utxos: IDL.Opt(
                IDL.Vec(
                  IDL.Record({
                    confirmations: IDL.Nat32,
                    value: IDL.Nat64,
                    outpoint: IDL.Record({
                      txid: IDL.Vec(IDL.Nat8),
                      vout: IDL.Nat32,
                    }),
                  }),
                ),
              ),
              current_confirmations: IDL.Opt(IDL.Nat32),
            }),
          }),
        }),
      ],
      [],
    ),
    btc_withdraw: IDL.Func(
      [IDL.Record({ to: IDL.Text, amount: IDL.Nat })],
      [
        IDL.Variant({
          Ok: IDL.Record({ block_index: IDL.Nat64 }),
          Err: IDL.Variant({
            MalformedAddress: IDL.Text,
            GenericError: IDL.Record({
              error_message: IDL.Text,
              error_code: IDL.Nat64,
            }),
            TemporarilyUnavailable: IDL.Reserved,
            InsufficientAllowance: IDL.Record({ allowance: IDL.Nat64 }),
            AlreadyProcessing: IDL.Null,
            Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
            InsufficientCredit: IDL.Record({}),
            BadFee: IDL.Record({ expected_fee: IDL.Nat }),
            AmountTooLow: IDL.Nat64,
            AllowanceChanged: IDL.Record({
              current_allowance: IDL.Nat,
            }),
            CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
            TooOld: IDL.Null,
            Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
            InsufficientFunds: IDL.Record({ balance: IDL.Reserved }),
          }),
        }),
      ],
      [],
    ),
    btc_withdrawal_status: IDL.Func(
      [IDL.Record({ block_index: IDL.Nat64 })],
      [
        IDL.Variant({
          Signing: IDL.Null,
          Confirmed: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
          Sending: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
          AmountTooLow: IDL.Null,
          WillReimburse: IDL.Record({
            account: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
            amount: IDL.Nat64,
            reason: IDL.Variant({
              CallFailed: IDL.Null,
              TaintedDestination: IDL.Record({
                kyt_fee: IDL.Nat64,
                kyt_provider: IDL.Principal,
              }),
            }),
          }),
          Unknown: IDL.Null,
          Submitted: IDL.Record({ txid: IDL.Vec(IDL.Nat8) }),
          Reimbursed: IDL.Record({
            account: IDL.Record({
              owner: IDL.Principal,
              subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
            }),
            mint_block_index: IDL.Nat64,
            amount: IDL.Nat64,
            reason: IDL.Variant({
              CallFailed: IDL.Null,
              TaintedDestination: IDL.Record({
                kyt_fee: IDL.Nat64,
                kyt_provider: IDL.Principal,
              }),
            }),
          }),
          Pending: IDL.Null,
        }),
      ],
      [],
    ),
    cancelAsks: IDL.Func(
      [IDL.Vec(OrderId), IDL.Opt(AccountRevision)],
      [IDL.Vec(CancelOrderResponse)],
      [],
    ),
    cancelBids: IDL.Func(
      [IDL.Vec(OrderId), IDL.Opt(AccountRevision)],
      [IDL.Vec(CancelOrderResponse)],
      [],
    ),
    cycles_withdraw: IDL.Func(
      [IDL.Record({ to: IDL.Principal, amount: IDL.Nat })],
      [
        IDL.Variant({
          Ok: IDL.Record({ txid: IDL.Nat, amount: IDL.Nat }),
          Err: IDL.Variant({
            FailedToWithdraw: IDL.Record({
              rejection_code: IDL.Variant({
                NoError: IDL.Null,
                CanisterError: IDL.Null,
                SysTransient: IDL.Null,
                DestinationInvalid: IDL.Null,
                Unknown: IDL.Null,
                SysFatal: IDL.Null,
                CanisterReject: IDL.Null,
              }),
              fee_block: IDL.Opt(IDL.Nat),
              rejection_reason: IDL.Text,
            }),
            GenericError: IDL.Record({
              error_message: IDL.Text,
              error_code: IDL.Nat64,
            }),
            TemporarilyUnavailable: IDL.Null,
            Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
            InsufficientCredit: IDL.Record({}),
            BadFee: IDL.Record({ expected_fee: IDL.Nat }),
            InvalidReceiver: IDL.Record({ receiver: IDL.Principal }),
            CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
            TooLowAmount: IDL.Record({}),
            TooOld: IDL.Null,
            InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
          }),
        }),
      ],
      [],
    ),
    getQuoteLedger: IDL.Func([], [IDL.Principal], ['query']),
    icrc84_deposit: IDL.Func([DepositArgs], [DepositResponse], []),
    icrc84_notify: IDL.Func([NotifyArg], [NotifyResponse], []),
    icrc84_query: IDL.Func(
      [IDL.Vec(Token)],
      [
        IDL.Vec(
          IDL.Tuple(
            Token,
            IDL.Record({
              credit: IDL.Int,
              tracked_deposit: IDL.Opt(Amount),
            }),
          ),
        ),
      ],
      ['query'],
    ),
    icrc84_supported_tokens: IDL.Func([], [IDL.Vec(Token)], ['query']),
    icrc84_token_info: IDL.Func([Token], [TokenInfo], ['query']),
    icrc84_withdraw: IDL.Func([WithdrawArgs], [WithdrawResponse], []),
    indicativeStats: IDL.Func([IDL.Principal], [OrderBookInfo], ['query']),
    listAdmins: IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    manageDarkOrderBooks: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Opt(EncryptedOrderBook))),
        IDL.Opt(IDL.Nat),
      ],
      [
        IDL.Variant({
          Ok: IDL.Vec(IDL.Opt(EncryptedOrderBook)),
          Err: IDL.Variant({
            UnknownAsset: IDL.Principal,
            NoCredit: IDL.Null,
            UnknownPrincipal: IDL.Null,
            AccountRevisionMismatch: IDL.Null,
          }),
        }),
      ],
      [],
    ),
    manageOrders: IDL.Func(
      [IDL.Opt(CancellationArg), PlaceArg, IDL.Opt(AccountRevision)],
      [ManageOrdersResponse],
      [],
    ),
    nextSession: IDL.Func(
      [],
      [IDL.Record({ counter: IDL.Nat, timestamp: IDL.Nat })],
      ['query'],
    ),
    placeAsks: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(Token, OrderBookType, IDL.Nat, IDL.Float64)),
        IDL.Opt(AccountRevision),
      ],
      [IDL.Vec(PlaceOrderResponse)],
      [],
    ),
    placeBids: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(Token, OrderBookType, IDL.Nat, IDL.Float64)),
        IDL.Opt(AccountRevision),
      ],
      [IDL.Vec(PlaceOrderResponse)],
      [],
    ),
    principalToSubaccount: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(IDL.Vec(IDL.Nat8))],
      ['query'],
    ),
    registerAsset: IDL.Func(
      [IDL.Principal, IDL.Nat],
      [
        IDL.Variant({
          Ok: IDL.Nat,
          Err: IDL.Variant({ AlreadyRegistered: IDL.Null }),
        }),
      ],
      [],
    ),
    removeAdmin: IDL.Func([IDL.Principal], [], []),
    replaceAsk: IDL.Func(
      [OrderId, IDL.Nat, IDL.Float64, IDL.Opt(AccountRevision)],
      [ReplaceOrderResponse],
      [],
    ),
    replaceBid: IDL.Func(
      [OrderId, IDL.Nat, IDL.Float64, IDL.Opt(AccountRevision)],
      [ReplaceOrderResponse],
      [],
    ),
    settings: IDL.Func(
      [],
      [
        IDL.Record({
          orderQuoteVolumeMinimum: IDL.Nat,
          orderPriceDigitsLimit: IDL.Nat,
          orderQuoteVolumeStep: IDL.Nat,
        }),
      ],
      ['query'],
    ),
  })
}
export const init = ({ IDL }) => {
  return [IDL.Opt(IDL.Principal), IDL.Opt(IDL.Principal)]
}
