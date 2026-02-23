import React, { useState, useEffect, useCallback, useMemo } from 'react'

import {
  Flex,
  Box,
  Image,
  Tooltip,
  Text,
  IconButton,
  Spinner,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  FormControl,
  FormLabel,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuList,
  useToast,
  useClipboard,
  useBreakpointValue,
  useDisclosure,
} from '@chakra-ui/react'
import { HttpAgent } from '@dfinity/agent'
import { Select } from 'bymax-react-select'
import { useFormik } from 'formik'
import { useWallet as useWalletPackage } from 'icrc84-package'
import { useTranslation } from 'react-i18next'
import { LuDownload, LuUpload } from 'react-icons/lu'
import { RiHandCoinLine } from 'react-icons/ri'
import * as Yup from 'yup'

import { idlFactory as Icrc84IDLFactory } from '../../../../../declarations/icrc1_auction/icrc1_auction.did'
import customStyles from '../../../../common/styles'
import { TokenDataItem, TokenMetadata, Option } from '../../../../types'
import {
  fixDecimal,
  convertVolumeFromCanister,
} from '../../../../utils/calculationsUtils'
import WithdrawalsConfirmationModal from '../../../confirmationModal'

interface TokenRowProps {
  token: TokenDataItem
  userAgent: HttpAgent
  userPrincipal: string
  handleNotify: (principal: string | undefined, base: string) => void
  handleWithdraw: (
    amount: number,
    account: string | undefined,
    token: TokenMetadata,
    network: string | null,
  ) => void
  handleDeposit: (
    amount: number,
    account: string | undefined,
    token: TokenMetadata,
  ) => void
  currentIndex: number | undefined
  onAccordionChange: (index: number | undefined) => void
}

const TokenRow: React.FC<TokenRowProps> = ({
  token,
  userAgent,
  userPrincipal,
  handleNotify,
  handleWithdraw,
  handleDeposit,
  currentIndex,
  onAccordionChange,
}) => {
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const bgColorMenu = useColorModeValue('grey.100', 'grey.900')
  const fontColor = useColorModeValue('grey.700', 'grey.25')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { t } = useTranslation()

  const [action, setAction] = useState('')
  const [networkOption, setNetworkOption] = useState<Option | Option[] | null>(
    null,
  )
  const [depositAllowance, setDepositAllowance] = useState<string | null>(null)
  const [maxDepositAllowance, setMaxDepositAllowance] = useState<string | null>(
    null,
  )

  const canisterId = `${process.env.CANISTER_ID_ICRC_AUCTION}`

  const claimTooltipTextStandard = (
    <>
      {t(`Claim Direct Deposit`)}
      <br />
      {t(`Please wait...`)}
    </>
  )
  const [claimTooltipText, setClaimTooltipText] = useState(
    claimTooltipTextStandard,
  )
  const { onCopy } = useClipboard(`${token.principal}`)
  const isMobile = useBreakpointValue({ base: true, md: false })

  const volumeInTotal = Number(token.volumeInTotal).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: token.decimals,
  })

  const volumeInLocked = Number(token.volumeInLocked).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: token.decimals,
  })

  const volumeInAvailable = Number(token.volumeInAvailable).toLocaleString(
    'en-US',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: token.decimals,
    },
  )

  const btcNetworkOptions = useMemo(
    () => [
      { value: 'bitcoin', label: 'BTC (experimental)', id: '1' },
      { value: 'ckbtc', label: 'ckBTC', id: '2' },
    ],
    [],
  )

  const cyclesNetworkOptions = useMemo(
    () => [
      { value: 'cycles', label: 'Canister top-up', id: '1' },
      { value: 'tcycles', label: 'ICRC-1 (TCYCLES)', id: '2' },
    ],
    [],
  )

  const networkOptions =
    token?.symbol === 'BTC'
      ? btcNetworkOptions
      : token?.symbol === 'TCYCLES'
        ? cyclesNetworkOptions
        : []

  const networkSelected =
    Array.isArray(networkOption) && networkOption.length > 0
      ? networkOption[0]
      : (networkOption as Option)

  const network =
    token?.symbol === 'BTC' || token?.symbol === 'TCYCLES'
      ? networkSelected?.value
      : null

  const toast = useToast({
    duration: 2000,
    position: 'top-right',
    isClosable: true,
  })

  const handleCopyToClipboard = () => {
    onCopy()
    toast({
      title: t('Copied'),
      description: t('Token principal copied to clipboard'),
      status: 'success',
    })
  }

  const isWithdrawConfirmationEnabled = (): boolean => {
    const storedValue = localStorage.getItem('withdrawalsDoubleConfirmation')
    return storedValue === 'true'
  }

  const initialValues = {
    amount: '',
    account: '',
    network: '',
    symbol: token.symbol,
    action: action,
    submit: false,
  }

  const validationSchema = Yup.object().shape({
    amount: Yup.number()
      .required(t('Amount is a required field'))
      .typeError('')
      .when('action', {
        is: 'withdraw',
        then: (schema) =>
          schema.max(token.volumeInAvailable || 0, t('Not enough funds')),
      })
      .when('action', {
        is: 'deposit',
        then: (schema) =>
          schema.max(Number(maxDepositAllowance) || 0, t('Not enough funds')),
      }),
    account: Yup.string()
      .required(t('Account is a required field'))
      .typeError(''),
    network: Yup.string().when('symbol', {
      is: (symbol: string) => ['BTC', 'TCYCLES'].includes(symbol),
      then: (schema) => schema.required(t('Network is required field')),
    }),
  })

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      if (Number(values.amount) > 0) {
        if (action === 'withdraw') {
          if (isWithdrawConfirmationEnabled()) onOpen()
          else
            handleWithdraw(
              Number(values.amount),
              values.account,
              token,
              network,
            )
        } else if (action === 'deposit') {
          handleDeposit(Number(values.amount), values.account, token)
        }
      }
    },
  })

  const handleNetworkChange = useCallback(
    (option: Option | Option[] | null) => {
      setNetworkOption(option)
      formik.setFieldValue(
        'network',
        Array.isArray(option) ? option[0]?.value : option?.value,
      )
    },
    [],
  )

  const handleWithdrawConfirm = () => {
    onClose()
    handleWithdraw(
      Number(formik.values.amount),
      formik.values.account,
      token,
      network,
    )
  }

  const getBalanceOf = useCallback(
    async (account: string | null = null) => {
      const { getBalance } = useWalletPackage(
        userAgent,
        canisterId,
        Icrc84IDLFactory,
      )
      const accountData = account ? account : userPrincipal
      const action = !account ? 'claim' : 'deposit'

      return await getBalance(
        [token],
        `${token.principal}`,
        accountData,
        action,
      )
    },
    [userAgent, userPrincipal, token],
  )

  const handleTrackedDeposit = useCallback(async () => {
    setClaimTooltipText(claimTooltipTextStandard)

    const { getTrackedDeposit } = useWalletPackage(
      userAgent,
      canisterId,
      Icrc84IDLFactory,
    )

    const balanceOf = await getBalanceOf()

    const trackedDeposit = await getTrackedDeposit(
      [token],
      `${token.principal}`,
    )

    const deposit =
      Array.isArray(trackedDeposit) && trackedDeposit[0]
        ? trackedDeposit[0].volumeInBase
        : null

    if (
      typeof balanceOf !== 'number' ||
      typeof deposit !== 'number' ||
      isNaN(balanceOf) ||
      isNaN(deposit)
    ) {
      setClaimTooltipText(
        <>
          {t(`Claim Direct Deposit`)}
          <br />
          {t(`Not Available`)}
        </>,
      )
    } else if (balanceOf <= deposit) {
      setClaimTooltipText(
        <>
          {t(`Claim Direct Deposit`)}
          <br />
          {t(`No deposits available`)}
        </>,
      )
    } else {
      setClaimTooltipText(
        <>
          {t(`Claim Direct Deposit`)}
          <br />
          {`${fixDecimal(balanceOf - deposit, token.decimals)} ${token.base} ${t('available')}`}
        </>,
      )
    }
  }, [getBalanceOf, userAgent, token])

  const handleAccordionToggle = (actionType: string) => {
    if (currentIndex === 0 && action === actionType) {
      onAccordionChange(undefined)
    } else if (currentIndex === undefined) {
      onAccordionChange(0)
      setAction(actionType)
    } else {
      setAction(actionType)
    }
  }

  const handleMaxAvailableClick = () => {
    if (action === 'withdraw')
      formik.setFieldValue('amount', token.volumeInAvailable)
  }

  const handleMaxDepositAllowance = useCallback(
    async (depositAllowanceAmount: string) => {
      if (formik.values.account && depositAllowanceAmount) {
        const balanceOf = await getBalanceOf(formik.values.account)

        const max =
          Math.min(Number(depositAllowanceAmount), Number(balanceOf)) -
          Number(token.fee)

        const amount = max > 0 ? fixDecimal(max, token.decimals) : '0'
        setMaxDepositAllowance(amount)
        return amount
      }
    },
    [getBalanceOf, token, formik.values.account],
  )

  const handleGetDepositAllowanceInfo = useCallback(async () => {
    setMaxDepositAllowance(null)

    if (formik.values.account) {
      const { getDepositAllowanceInfo } = useWalletPackage(
        userAgent,
        canisterId,
        Icrc84IDLFactory,
      )

      const result = await getDepositAllowanceInfo(
        token.principal,
        formik.values.account,
      )

      if (result?.allowance !== undefined && result?.allowance !== null) {
        const { volumeInBase: allowanceResult } = convertVolumeFromCanister(
          Number(result.allowance),
          token.decimals,
          0,
        )
        const amount = fixDecimal(allowanceResult, token.decimals)
        setDepositAllowance(amount)
        handleMaxDepositAllowance(amount)
      } else setDepositAllowance(null)
    }
  }, [userAgent, token, formik.values.account, handleMaxDepositAllowance])

  useEffect(() => {
    if (action === 'deposit') {
      handleGetDepositAllowanceInfo()
    }
  }, [formik.values.account, action, handleGetDepositAllowanceInfo])

  useEffect(() => {
    formik.setFieldValue('action', action)
    formik.resetForm({ values: initialValues })
    setMaxDepositAllowance(null)
    setDepositAllowance(null)
  }, [action])

  useEffect(() => {
    if (token.withdrawStatus === 'success') {
      formik.setStatus({ success: true })
      formik.resetForm({ values: initialValues })
      handleNetworkChange(null)
    } else if (token.withdrawStatus === 'error') {
      formik.setStatus({ success: false })
    }
  }, [token.withdrawStatus])

  return (
    <>
      <Accordion allowToggle index={currentIndex === 0 ? 0 : undefined}>
        <AccordionItem border="none">
          <>
            <AccordionButton display="none" />
            <Flex key={token.id} justify="space-between" align="center" py={2}>
              <Flex align="center">
                <Menu>
                  <Tooltip label={token.principal} aria-label="Token Principal">
                    <MenuButton
                      as={Flex}
                      align="center"
                      cursor="pointer"
                      onClick={handleCopyToClipboard}
                    >
                      <Flex align="center" cursor="pointer">
                        <Image
                          src={token.logo}
                          alt={token.symbol}
                          boxSize="30px"
                        />
                        <Text ml={2} fontSize="15px" fontWeight={600}>
                          {token.symbol}
                        </Text>
                      </Flex>
                    </MenuButton>
                  </Tooltip>
                  {isMobile && (
                    <MenuList bg={bgColorMenu} p={2}>
                      {token.principal}
                    </MenuList>
                  )}
                </Menu>
              </Flex>
              <Flex direction="column" align="flex-end" ml={2} overflowX="auto">
                <Flex align="center" overflowX="auto" whiteSpace="nowrap">
                  <Text mr={2}>{volumeInTotal}</Text>
                  <Tooltip label="Deposit by Allowance" aria-label="Allowance">
                    <IconButton
                      aria-label="Allowance"
                      icon={<RiHandCoinLine size="15px" />}
                      variant="ghost"
                      size="xs"
                      _hover={{
                        bg: bgColorHover,
                      }}
                      onClick={() => handleAccordionToggle('deposit')}
                    />
                  </Tooltip>
                  <Tooltip label={claimTooltipText} aria-label="Claim Deposit">
                    <IconButton
                      hidden //Individual claim, in the future it should be enabled
                      aria-label="Claim Deposit"
                      icon={
                        token?.notifyLoading ? (
                          <Spinner size="xs" />
                        ) : (
                          <LuDownload size="15px" />
                        )
                      }
                      onClick={() => {
                        handleNotify(token.principal, token.base)
                        setAction('claim')
                      }}
                      onMouseEnter={handleTrackedDeposit}
                      variant="ghost"
                      size="xs"
                      _hover={{
                        bg: bgColorHover,
                      }}
                    />
                  </Tooltip>
                  <Tooltip label="Withdraw" aria-label="Withdraw">
                    <IconButton
                      aria-label="Withdraw"
                      icon={<LuUpload size="15px" />}
                      variant="ghost"
                      size="xs"
                      _hover={{
                        bg: bgColorHover,
                      }}
                      onClick={() => handleAccordionToggle('withdraw')}
                    />
                  </Tooltip>
                </Flex>
                <Flex
                  direction="row"
                  justify="space-between"
                  align="center"
                  w="full"
                >
                  <Text fontSize="12px" color="grey.400">
                    {volumeInLocked} {t('Locked')}
                  </Text>
                  <Text ml={2} fontSize="12px" color="grey.400">
                    {volumeInAvailable} {t('Available')}
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            <AccordionPanel pb={4}>
              <Flex direction="column" gap={4}>
                {(token.symbol === 'BTC' || token.symbol === 'TCYCLES') && (
                  <Box>
                    <Select
                      id="network"
                      value={networkSelected?.label ? networkSelected : null}
                      isMulti={false}
                      isClearable={true}
                      options={networkOptions}
                      isInvalid={
                        !!formik.errors.network && formik.touched.network
                      }
                      placeholder={
                        networkOptions?.length <= 0
                          ? t('Loading...')
                          : t('Select a network')
                      }
                      noOptionsMessage={t('No network found')}
                      isLoading={networkOptions?.length <= 0}
                      loadingMessage={t('Loading...')}
                      onChange={handleNetworkChange}
                      styles={customStyles as any}
                    />
                    {!!formik.errors.network && formik.touched.network && (
                      <Text color="red.500" fontSize="12px">
                        {formik.errors.network}
                      </Text>
                    )}
                  </Box>
                )}
                <Flex direction="column">
                  <FormControl variant="floating">
                    <Input
                      h="58px"
                      placeholder=" "
                      name="account"
                      sx={{ borderRadius: '5px' }}
                      isInvalid={
                        !!formik.errors.account && formik.touched.account
                      }
                      isDisabled={false}
                      value={formik.values.account}
                      onKeyUp={() => formik.validateField('account')}
                      onChange={(e) => {
                        formik.handleChange(e)
                      }}
                    />
                    <FormLabel color="grey.500" fontSize="15px">
                      {action === 'deposit'
                        ? t('Source account')
                        : network === 'cycles'
                          ? 'Canister Id'
                          : t('Destination account')}
                    </FormLabel>
                    {depositAllowance && (
                      <Text color="grey.400" fontSize="12px">
                        {t('Allowance amount:')} {depositAllowance} {token.base}
                      </Text>
                    )}
                    {!!formik.errors.account && formik.touched.account && (
                      <Text color="red.500" fontSize="12px">
                        {formik.errors.account}
                      </Text>
                    )}
                  </FormControl>
                </Flex>
                <Flex direction="column">
                  <InputGroup>
                    <FormControl variant="floating">
                      <Input
                        h="58px"
                        placeholder=" "
                        name="amount"
                        sx={{ borderRadius: '5px' }}
                        isInvalid={
                          !!formik.errors.amount && formik.touched.amount
                        }
                        isDisabled={false}
                        value={formik.values.amount}
                        onKeyUp={() => formik.validateField('amount')}
                        onChange={(e) => {
                          formik.handleChange(e)
                        }}
                      />
                      <FormLabel color="grey.500" fontSize="15px">
                        Amount
                      </FormLabel>
                    </FormControl>
                    <InputRightElement h="58px">
                      <Button
                        h="58px"
                        fontSize="11px"
                        borderRadius="0 5px 5px 0"
                        bgColor={'grey.500'}
                        color="grey.25"
                        _hover={{
                          bg: 'grey.400',
                          color: 'grey.25',
                        }}
                        onClick={async () => {
                          if (action === 'withdraw') {
                            handleMaxAvailableClick()
                          } else if (action === 'deposit' && depositAllowance) {
                            const amount =
                              await handleMaxDepositAllowance(depositAllowance)
                            formik.setFieldValue('amount', amount)
                          }
                        }}
                      >
                        Max
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {maxDepositAllowance && (
                    <Text color="grey.400" fontSize="12px">
                      {t('Max available:')} {maxDepositAllowance} {token.base}
                    </Text>
                  )}
                  {!!formik.errors.amount && formik.touched.amount && (
                    <Text color="red.500" fontSize="12px">
                      {formik.errors.amount}
                    </Text>
                  )}
                </Flex>
                <Flex direction="column">
                  <Button
                    background={bgColor}
                    variant="solid"
                    h="58px"
                    color={fontColor}
                    _hover={{
                      bg: bgColorHover,
                      color: fontColor,
                    }}
                    isDisabled={
                      (action === 'withdraw' &&
                        token.withdrawStatus === 'loading') ||
                      (action === 'deposit' &&
                        token.depositStatus === 'loading')
                    }
                    onClick={() => formik.handleSubmit()}
                  >
                    {action === 'withdraw' ? (
                      token.withdrawStatus === 'loading' ? (
                        <>
                          {t('Withdraw')}{' '}
                          <Spinner ml={2} size="sm" color={fontColor} />
                        </>
                      ) : (
                        t('Withdraw')
                      )
                    ) : action === 'deposit' ? (
                      token.depositStatus === 'loading' ? (
                        <>
                          {t('Deposit')}{' '}
                          <Spinner ml={2} size="sm" color={fontColor} />
                        </>
                      ) : (
                        t('Deposit')
                      )
                    ) : null}
                  </Button>
                </Flex>
              </Flex>
            </AccordionPanel>
          </>
        </AccordionItem>
      </Accordion>

      <WithdrawalsConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleWithdrawConfirm}
        title={t('Confirm Withdraw')}
        description={
          <>
            <Text>
              {t('Are you sure you want to withdraw')}{' '}
              <strong>
                {formik.values.amount} {token.base}
              </strong>{' '}
              {t('to address')}
            </Text>
            <Text mt={3}>
              <strong>{formik.values.account}</strong>?
            </Text>
            <Text mt={3}>{t('This action cannot be undone.')}</Text>
          </>
        }
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
      />
    </>
  )
}

export default TokenRow
