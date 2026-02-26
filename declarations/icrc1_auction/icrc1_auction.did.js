export const idlFactory = ({ IDL }) => {
  const AuctionQuerySelection = IDL.Record({
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
  })
  const PriceHistoryItem = IDL.Tuple(
    IDL.Nat64,
    IDL.Nat,
    IDL.Principal,
    IDL.Nat,
    IDL.Float64,
  )
  const CreditInfo = IDL.Record({
    total: IDL.Nat,
    locked: IDL.Nat,
    available: IDL.Nat,
  })
  const EncryptedOrderBook = IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Nat8))
  const OrderId = IDL.Nat
  const OrderBookType = IDL.Variant({
    delayed: IDL.Null,
    immediate: IDL.Null,
  })
  const Order = IDL.Record({
    icrc1Ledger: IDL.Principal,
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
  const OrderBookInfo = IDL.Record({
    clearing: IDL.Variant({
      match: IDL.Record({ volume: IDL.Nat, price: IDL.Float64 }),
      noMatch: IDL.Null,
    }),
    totalAskVolume: IDL.Nat,
    minAskPrice: IDL.Opt(IDL.Float64),
    maxBidPrice: IDL.Opt(IDL.Float64),
    totalBidVolume: IDL.Nat,
  })
  const TransactionHistoryItem = IDL.Tuple(
    IDL.Nat64,
    IDL.Nat,
    IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
    IDL.Principal,
    IDL.Nat,
    IDL.Float64,
  )
  const DepositHistoryItem = IDL.Tuple(
    IDL.Nat64,
    IDL.Variant({ deposit: IDL.Null, withdrawal: IDL.Null }),
    IDL.Principal,
    IDL.Nat,
  )
  const AuctionQueryResponse = IDL.Record({
    last_prices: IDL.Vec(PriceHistoryItem),
    credits: IDL.Vec(IDL.Tuple(IDL.Principal, CreditInfo)),
    last_immediate_prices: IDL.Vec(PriceHistoryItem),
    dark_order_books: IDL.Vec(IDL.Tuple(IDL.Principal, EncryptedOrderBook)),
    asks: IDL.Vec(IDL.Tuple(OrderId, Order)),
    bids: IDL.Vec(IDL.Tuple(OrderId, Order)),
    account_revision: IDL.Nat,
    immediate_order_book_info: IDL.Vec(
      IDL.Tuple(IDL.Principal, ImmediateOrderBookInfo),
    ),
    session_numbers: IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat)),
    immediate_price_history: IDL.Vec(PriceHistoryItem),
    order_book_info: IDL.Vec(IDL.Tuple(IDL.Principal, OrderBookInfo)),
    transaction_history: IDL.Vec(TransactionHistoryItem),
    price_history: IDL.Vec(PriceHistoryItem),
    points: IDL.Nat,
    deposit_history: IDL.Vec(DepositHistoryItem),
  })
  const Utxo = IDL.Record({
    height: IDL.Nat32,
    value: IDL.Nat64,
    outpoint: IDL.Record({ txid: IDL.Vec(IDL.Nat8), vout: IDL.Nat32 }),
  })
  const SuspendedReason = IDL.Variant({
    ValueTooSmall: IDL.Null,
    Quarantined: IDL.Null,
  })
  const SuspendedUtxo = IDL.Record({
    utxo: Utxo,
    earliest_retry: IDL.Nat64,
    reason: SuspendedReason,
  })
  const PendingUtxo = IDL.Record({
    confirmations: IDL.Nat32,
    value: IDL.Nat64,
    outpoint: IDL.Record({ txid: IDL.Vec(IDL.Nat8), vout: IDL.Nat32 }),
  })
  const BtcNotifyResult = IDL.Variant({
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
        suspended_utxos: IDL.Opt(IDL.Vec(SuspendedUtxo)),
        required_confirmations: IDL.Nat32,
        pending_utxos: IDL.Opt(IDL.Vec(PendingUtxo)),
        current_confirmations: IDL.Opt(IDL.Nat32),
      }),
    }),
  })
  const BtcWithdrawResult = IDL.Variant({
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
      AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
      CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
      TooOld: IDL.Null,
      Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
      InsufficientFunds: IDL.Record({ balance: IDL.Reserved }),
    }),
  })
  const ReimbursementReason = IDL.Variant({
    CallFailed: IDL.Null,
    TaintedDestination: IDL.Record({
      kyt_fee: IDL.Nat64,
      kyt_provider: IDL.Principal,
    }),
  })
  const RetrieveBtcStatusV2 = IDL.Variant({
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
      reason: ReimbursementReason,
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
      reason: ReimbursementReason,
    }),
    Pending: IDL.Null,
  })
  const CancellationResult = IDL.Tuple(
    OrderId,
    IDL.Principal,
    OrderBookType,
    IDL.Nat,
    IDL.Float64,
  )
  const CancelOrderError = IDL.Variant({
    UnknownOrder: IDL.Null,
    UnknownPrincipal: IDL.Null,
    AccountRevisionMismatch: IDL.Null,
  })
  const UpperResult_5 = IDL.Variant({
    Ok: CancellationResult,
    Err: CancelOrderError,
  })
  const DirectCyclesWithdrawResult = IDL.Variant({
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
  })
  const SharedUserSettings = IDL.Record({
    pushNotificationsEnabled: IDL.Bool,
  })
  const DepositArgs = IDL.Record({
    token: IDL.Principal,
    from: IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    }),
    amount: IDL.Nat,
    expected_fee: IDL.Opt(IDL.Nat),
  })
  const DepositResponse = IDL.Variant({
    Ok: IDL.Record({
      credit_inc: IDL.Nat,
      txid: IDL.Nat,
      credit: IDL.Int,
    }),
    Err: IDL.Variant({
      TransferError: IDL.Record({ message: IDL.Text }),
      AmountBelowMinimum: IDL.Record({}),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    }),
  })
  const NotifyArgs = IDL.Record({ token: IDL.Principal })
  const NotifyResponse = IDL.Variant({
    Ok: IDL.Record({
      credit_inc: IDL.Nat,
      credit: IDL.Int,
      deposit_inc: IDL.Nat,
    }),
    Err: IDL.Variant({
      NotAvailable: IDL.Record({ message: IDL.Text }),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
    }),
  })
  const TokenInfo = IDL.Record({
    allowance_fee: IDL.Nat,
    withdrawal_fee: IDL.Nat,
    deposit_fee: IDL.Nat,
  })
  const WithdrawArgs = IDL.Record({
    to: IDL.Record({
      owner: IDL.Principal,
      subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
    }),
    token: IDL.Principal,
    amount: IDL.Nat,
    expected_fee: IDL.Opt(IDL.Nat),
  })
  const WithdrawResponse = IDL.Variant({
    Ok: IDL.Record({ txid: IDL.Nat, amount: IDL.Nat }),
    Err: IDL.Variant({
      AmountBelowMinimum: IDL.Record({}),
      InsufficientCredit: IDL.Record({}),
      CallLedgerError: IDL.Record({ message: IDL.Text }),
      BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    }),
  })
  const UpperResult_4 = IDL.Variant({
    Ok: IDL.Vec(IDL.Opt(EncryptedOrderBook)),
    Err: IDL.Variant({
      UnknownAsset: IDL.Principal,
      NoCredit: IDL.Null,
      UnknownPrincipal: IDL.Null,
      AccountRevisionMismatch: IDL.Null,
    }),
  })
  const PlaceOrderResult = IDL.Tuple(
    OrderId,
    IDL.Variant({
      placed: IDL.Null,
      executed: IDL.Vec(IDL.Tuple(IDL.Float64, IDL.Nat)),
    }),
  )
  const InternalPlaceOrderError = IDL.Variant({
    ConflictingOrder: IDL.Tuple(
      IDL.Variant({ ask: IDL.Null, bid: IDL.Null }),
      IDL.Opt(OrderId),
    ),
    UnknownAsset: IDL.Null,
    NoCredit: IDL.Null,
    VolumeStepViolated: IDL.Record({ baseVolumeStep: IDL.Nat }),
    TooLowOrder: IDL.Null,
    PriceDigitsOverflow: IDL.Record({ maxDigits: IDL.Nat }),
  })
  const ManageOrdersError = IDL.Variant({
    placement: IDL.Record({
      error: InternalPlaceOrderError,
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
  })
  const UpperResult_3 = IDL.Variant({
    Ok: IDL.Tuple(IDL.Vec(CancellationResult), IDL.Vec(PlaceOrderResult)),
    Err: ManageOrdersError,
  })
  const PlaceOrderError = IDL.Variant({
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
  })
  const UpperResult_2 = IDL.Variant({
    Ok: PlaceOrderResult,
    Err: PlaceOrderError,
  })
  const RegisterAssetError = IDL.Variant({ AlreadyRegistered: IDL.Null })
  const UpperResult_1 = IDL.Variant({
    Ok: IDL.Nat,
    Err: RegisterAssetError,
  })
  const ReplaceOrderError = IDL.Variant({
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
  })
  const UpperResult = IDL.Variant({
    Ok: PlaceOrderResult,
    Err: ReplaceOrderError,
  })
  return IDL.Service({
    addAdmin: IDL.Func([IDL.Principal], [], []),
    auction_query: IDL.Func(
      [IDL.Vec(IDL.Principal), AuctionQuerySelection],
      [AuctionQueryResponse],
      ['query'],
    ),
    btc_depositAddress: IDL.Func(
      [IDL.Opt(IDL.Principal)],
      [IDL.Text],
      ['query'],
    ),
    btc_notify: IDL.Func([], [BtcNotifyResult], []),
    btc_withdraw: IDL.Func(
      [IDL.Record({ to: IDL.Text, amount: IDL.Nat })],
      [BtcWithdrawResult],
      [],
    ),
    btc_withdrawal_status: IDL.Func(
      [IDL.Record({ block_index: IDL.Nat64 })],
      [RetrieveBtcStatusV2],
      [],
    ),
    cancelAsks: IDL.Func(
      [IDL.Vec(OrderId), IDL.Opt(IDL.Nat)],
      [IDL.Vec(UpperResult_5)],
      [],
    ),
    cancelBids: IDL.Func(
      [IDL.Vec(OrderId), IDL.Opt(IDL.Nat)],
      [IDL.Vec(UpperResult_5)],
      [],
    ),
    cycles_withdraw: IDL.Func(
      [IDL.Record({ to: IDL.Principal, amount: IDL.Nat })],
      [DirectCyclesWithdrawResult],
      [],
    ),
    getQuoteLedger: IDL.Func([], [IDL.Principal], ['query']),
    getUserSettings: IDL.Func([], [SharedUserSettings], ['query']),
    icrc84_deposit: IDL.Func([DepositArgs], [DepositResponse], []),
    icrc84_notify: IDL.Func([NotifyArgs], [NotifyResponse], []),
    icrc84_query: IDL.Func(
      [IDL.Vec(IDL.Principal)],
      [
        IDL.Vec(
          IDL.Tuple(
            IDL.Principal,
            IDL.Record({
              credit: IDL.Int,
              tracked_deposit: IDL.Opt(IDL.Nat),
            }),
          ),
        ),
      ],
      ['query'],
    ),
    icrc84_supported_tokens: IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    icrc84_token_info: IDL.Func([IDL.Principal], [TokenInfo], ['query']),
    icrc84_withdraw: IDL.Func([WithdrawArgs], [WithdrawResponse], []),
    indicativeStats: IDL.Func([IDL.Principal], [OrderBookInfo], ['query']),
    listAdmins: IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    manageDarkOrderBooks: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Opt(EncryptedOrderBook))),
        IDL.Opt(IDL.Nat),
      ],
      [UpperResult_4],
      [],
    ),
    manageOrders: IDL.Func(
      [
        IDL.Opt(
          IDL.Variant({
            all: IDL.Opt(IDL.Vec(IDL.Principal)),
            orders: IDL.Vec(IDL.Variant({ ask: OrderId, bid: OrderId })),
          }),
        ),
        IDL.Vec(
          IDL.Variant({
            ask: IDL.Tuple(IDL.Principal, OrderBookType, IDL.Nat, IDL.Float64),
            bid: IDL.Tuple(IDL.Principal, OrderBookType, IDL.Nat, IDL.Float64),
          }),
        ),
        IDL.Opt(IDL.Nat),
      ],
      [UpperResult_3],
      [],
    ),
    nextSession: IDL.Func(
      [],
      [IDL.Record({ counter: IDL.Nat, timestamp: IDL.Nat })],
      ['query'],
    ),
    placeAsks: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(IDL.Principal, OrderBookType, IDL.Nat, IDL.Float64)),
        IDL.Opt(IDL.Nat),
      ],
      [IDL.Vec(UpperResult_2)],
      [],
    ),
    placeBids: IDL.Func(
      [
        IDL.Vec(IDL.Tuple(IDL.Principal, OrderBookType, IDL.Nat, IDL.Float64)),
        IDL.Opt(IDL.Nat),
      ],
      [IDL.Vec(UpperResult_2)],
      [],
    ),
    principalToSubaccount: IDL.Func(
      [IDL.Principal],
      [IDL.Opt(IDL.Vec(IDL.Nat8))],
      ['query'],
    ),
    registerAsset: IDL.Func([IDL.Principal, IDL.Nat], [UpperResult_1], []),
    removeAdmin: IDL.Func([IDL.Principal], [], []),
    replaceAsk: IDL.Func(
      [OrderId, IDL.Nat, IDL.Float64, IDL.Opt(IDL.Nat)],
      [UpperResult],
      [],
    ),
    replaceBid: IDL.Func(
      [OrderId, IDL.Nat, IDL.Float64, IDL.Opt(IDL.Nat)],
      [UpperResult],
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
    updateUserSettings: IDL.Func(
      [IDL.Record({ pushNotificationsEnabled: IDL.Opt(IDL.Bool) })],
      [SharedUserSettings],
      [],
    ),
  })
}
export const init = ({ IDL }) => {
  return [
    IDL.Opt(IDL.Principal),
    IDL.Opt(IDL.Principal),
    IDL.Opt(IDL.Principal),
  ]
}
