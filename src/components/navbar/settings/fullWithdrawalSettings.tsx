import React, { useCallback } from 'react'

import {
  Flex,
  Input,
  InputGroup,
  FormControl,
  FormLabel,
  Button,
  Spinner,
  Text,
  useToast,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react'
import { useFormik } from 'formik'
import { useWallet as useWalletPackage } from 'icrc84-package'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import * as Yup from 'yup'

import { idlFactory as Icrc84IDLFactory } from '../../../../declarations/icrc1_auction/icrc1_auction.did'
import useAuctionQuery from '../../../hooks/useAuctionQuery'
import useOrders from '../../../hooks/useOrders'
import { RootState, AppDispatch } from '../../../store'
import { setIsRefreshBalances } from '../../../store/balances'
import { setIsRefreshUserData } from '../../../store/orders'
import { TokenDataItem } from '../../../types'
import { decodeIcrcAccountText } from '../../../utils/convertionsUtils'
import { getErrorMessageManageOrders } from '../../../utils/orderUtils'
import { getSimpleToastDescription } from '../../../utils/uiUtils'
import { getErrorMessageWithdraw } from '../../../utils/walletUtils'
import WithdrawalsConfirmationModal from '../../confirmationModal'

const fullWithdrawSettings: React.FC = () => {
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const buttonBgColor = useColorModeValue('grey.500', 'grey.600')
  const fontColor = useColorModeValue('grey.25', 'grey.25')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { t } = useTranslation()
  const dispatch = useDispatch<AppDispatch>()

  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })

  const { userAgent } = useSelector((state: RootState) => state.auth)
  const tokens = useSelector((state: RootState) => state.tokens.tokens)

  const canisterId = `${process.env.CANISTER_ID_ICRC_AUCTION}`

  const fetchManageOrders = useCallback(async () => {
    const { manageOrders } = useOrders()
    return await manageOrders(userAgent)
  }, [userAgent])

  const fetchWithdrawals = useCallback(
    async (account: string) => {
      const { withdrawCredit } = useWalletPackage(
        userAgent,
        canisterId,
        Icrc84IDLFactory,
      )

      try {
        const { getQuerys } = useAuctionQuery()
        const { credits: balancesCredits = [] } = await getQuerys(userAgent, {
          tokens: tokens,
          queryTypes: ['credits'],
        })

        const withdrawalPromises = balancesCredits
          .filter(
            (balance: TokenDataItem) => Number(balance.volumeInTotalNat) > 0,
          )
          .map(async (balance: TokenDataItem) => {
            const response = await withdrawCredit(
              balance.principal,
              account,
              Number(balance.volumeInTotalNat),
            )

            return {
              balance,
              response,
            }
          })

        const results = await Promise.all(withdrawalPromises)

        const errors = results.filter(
          ({ response }) => response && 'Err' in response,
        )
        const successes = results.filter(
          ({ response }) => response && 'Ok' in response,
        )

        return { errors, successes }
      } catch (error) {
        return { Err: error }
      }
    },
    [userAgent, tokens],
  )

  const validateAddress = useCallback((address: string) => {
    try {
      const account = decodeIcrcAccountText(address)
      if (!account) {
        return false
      }
      return true
    } catch {
      return false
    }
  }, [])

  const initialValues = {
    destinationAccount: '',
    submit: false,
  }

  const validationSchema = Yup.object().shape({
    destinationAccount: Yup.string()
      .required(t('Address is required'))
      .test('is-valid-address', 'Invalid Address', function (value) {
        return validateAddress(value)
      })
      .typeError(t('Invalid Address format')),
  })

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async () => {
      onOpen()
    },
  })

  const handleWithdrawConfirm = async () => {
    try {
      let startTime = Date.now()

      onClose()

      let toastId = toast({
        title: t('Manage orders pending'),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      const response = await fetchManageOrders()

      let endTime = Date.now()
      let durationInSeconds = (endTime - startTime) / 1000

      if (Object.keys(response).includes('Ok')) {
        if (toastId) {
          toast.update(toastId, {
            title: 'Success',
            description: getSimpleToastDescription(
              t('Manage orders done'),
              durationInSeconds,
            ),
            status: 'success',
            isClosable: true,
          })
        }

        dispatch(setIsRefreshUserData())
      } else {
        if (toastId) {
          const description =
            'Err' in response
              ? getErrorMessageManageOrders(response.Err)
              : t('Unknown error')
          toast.update(toastId, {
            title: t('Manage orders rejected'),
            description: getSimpleToastDescription(
              description,
              durationInSeconds,
            ),
            status: 'error',
            isClosable: true,
          })
        }
        return
      }

      toastId = toast({
        title: t('Full withdrawal pending'),
        description: t('Please wait...'),
        status: 'loading',
        duration: null,
        isClosable: true,
      })

      startTime = Date.now()

      const result = await fetchWithdrawals(formik.values.destinationAccount)

      endTime = Date.now()
      durationInSeconds = (endTime - startTime) / 1000

      if (toastId) {
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors
            .map(({ balance, response }) => {
              const errorType = response
                ? 'Err' in response
                  ? getErrorMessageWithdraw(response.Err)
                  : t('Unknown error')
                : t('Unknown error')
              return `${t('Error for withdrawal')} ${balance.symbol}: ${errorType}`
            })
            .join('\n')

          toast.update(toastId, {
            title: t('Full withdrawal rejected'),
            description: (
              <>
                <div style={{ whiteSpace: 'pre-line' }}>{errorMessages}</div>
                <div
                  style={{
                    fontSize: '0.8em',
                    textAlign: 'right',
                    marginTop: '0.5em',
                  }}
                >
                  {`${t('Duration')}: ${durationInSeconds.toFixed(1)}s`}
                </div>
              </>
            ),
            status: 'error',
            isClosable: true,
          })
        } else if (result.successes && result.successes.length > 0) {
          toast.update(toastId, {
            title: t('Success'),
            description: getSimpleToastDescription(
              t('Full withdrawal done'),
              durationInSeconds,
            ),
            status: 'success',
            isClosable: true,
          })

          dispatch(setIsRefreshBalances())
        } else {
          toast.update(toastId, {
            title: t('No withdrawal made'),
            description: getSimpleToastDescription(
              t('Insufficient balance in all assets.'),
              durationInSeconds,
            ),
            status: 'warning',
            isClosable: true,
          })
        }
      }

      formik.setStatus({ success: true })
      formik.setSubmitting(false)
    } catch (error) {
      formik.setStatus({ success: false })
      formik.setSubmitting(false)

      formik.setFieldError(
        'destinationAccount',
        t('Auction canister call error'),
      )
    }
  }

  return (
    <>
      <InputGroup>
        <FormControl variant="floating">
          <Input
            h="58px"
            placeholder=" "
            name="destinationAccount"
            isInvalid={
              !!formik.errors.destinationAccount &&
              formik.touched.destinationAccount
            }
            isDisabled={false}
            value={formik.values.destinationAccount}
            onChange={(e) => formik.handleChange(e)}
          />
          <FormLabel color="grey.500" fontSize="15px">
            {t('Destination account')}
          </FormLabel>
        </FormControl>
      </InputGroup>
      {!!formik.errors.destinationAccount &&
        formik.touched.destinationAccount && (
          <Text color="red.500" fontSize="12px">
            {formik.errors.destinationAccount}
          </Text>
        )}
      <Flex direction="column" mt={4}>
        <Button
          background={buttonBgColor}
          variant="solid"
          h="58px"
          color={fontColor}
          _hover={{
            bg: bgColorHover,
            color: fontColor,
          }}
          isDisabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
        >
          {formik.isSubmitting ? (
            <>
              {t('Withdraw')} <Spinner ml={2} size="sm" color={fontColor} />
            </>
          ) : (
            t('Withdraw')
          )}
        </Button>
      </Flex>

      <WithdrawalsConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleWithdrawConfirm}
        title={t('Confirm Withdraw')}
        description={
          <>
            <Text>
              {t('Are you sure you want to full withdraw to address')}
            </Text>
            <Text mt={3}>
              <strong>{formik.values.destinationAccount}</strong>?
            </Text>
            <Text mt={3}>{t('This action cannot be undone')}.</Text>
          </>
        }
        confirmText={t('Confirm')}
        cancelText={t('Cancel')}
      />
    </>
  )
}

export default fullWithdrawSettings
