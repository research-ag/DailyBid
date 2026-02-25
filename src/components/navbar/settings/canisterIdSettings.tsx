import React, { useEffect, useCallback } from 'react'

import {
  Flex,
  Input,
  InputGroup,
  InputRightElement,
  FormControl,
  FormLabel,
  Button,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { Principal } from '@icp-sdk/core/principal'
import { useFormik } from 'formik'
import { useSelector, useDispatch } from 'react-redux'
import * as Yup from 'yup'

import useTokens from '../../../hooks/useTokens'
import { RootState, AppDispatch } from '../../../store'
import { setUserDeposit, setUserDepositCycles } from '../../../store/auth'
import { setIsRefreshUserData } from '../../../store/orders'
import { setIsRefreshPrices } from '../../../store/prices'
import {
  setTokens,
  setSelectedSymbol,
  setSelectedQuote,
} from '../../../store/tokens'
import { Option } from '../../../types'
import { getActor, getAuctionCanisterId } from '../../../utils/canisterUtils'
import { getUserDepositAddress } from '../../../utils/convertionsUtils'
import { depositCyclesCommandString } from '../../../utils/walletUtils'

const CanisterIdSettings: React.FC = () => {
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const buttonBgColor = useColorModeValue('grey.500', 'grey.600')
  const fontColor = useColorModeValue('grey.25', 'grey.25')

  const dispatch = useDispatch<AppDispatch>()

  const quoteTokenDefault = process.env.ENV_TOKEN_QUOTE_DEFAULT || 'USDT'
  const tokenDefault = process.env.ENV_TOKEN_SELECTED_DEFAULT

  const { userAgent } = useSelector((state: RootState) => state.auth)

  const fetchTokens = useCallback(async () => {
    const { getTokens } = useTokens()
    const data = await getTokens(userAgent)

    const quoteToken = data.tokens.find(
      (token) => token.symbol === (data?.quoteToken?.base || quoteTokenDefault),
    )

    let initialSymbol = data.tokens.find((token) => token.base === tokenDefault)
    initialSymbol =
      initialSymbol && initialSymbol?.base === tokenDefault
        ? initialSymbol
        : data.tokens[0]
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

    dispatch(setTokens(data.tokens))

    if (quoteToken) {
      dispatch(setSelectedQuote(quoteToken))
    }
  }, [])

  const validateCanisterId = useCallback((canisterId: string) => {
    try {
      Principal.fromText(canisterId)
      return true
    } catch {
      return false
    }
  }, [])

  const initialValues = {
    canisterId: '',
    submit: false,
  }

  const validationSchema = Yup.object().shape({
    canisterId: Yup.string()
      .required('Canister ID is required')
      .test('is-valid-canister-id', 'Invalid Canister ID', function (value) {
        return validateCanisterId(value)
      })
      .typeError('Invalid Canister ID format'),
  })

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      try {
        const serviceActor = getActor(userAgent, values.canisterId)
        await serviceActor.getQuoteLedger()

        localStorage.setItem('auctionCanisterId', values.canisterId)

        await fetchTokens()
        dispatch(setIsRefreshUserData())
        dispatch(setIsRefreshPrices())

        const principal = await userAgent.getPrincipal()
        dispatch(setUserDeposit(getUserDepositAddress(principal.toText())))

        const depositCyclescommandText = depositCyclesCommandString(
          values.canisterId,
          principal.toText(),
          null,
        )
        dispatch(setUserDepositCycles(depositCyclescommandText))

        setStatus({ success: true })
        setSubmitting(false)
      } catch (error) {
        setStatus({ success: false })
        setSubmitting(false)

        formik.setFieldError('canisterId', 'Auction canister call error')
      }
    },
  })

  useEffect(() => {
    formik.setFieldValue('canisterId', getAuctionCanisterId())
  }, [])

  return (
    <>
      <InputGroup>
        <FormControl variant="floating">
          <Input
            h="58px"
            placeholder=" "
            name="canisterId"
            sx={{
              borderRadius: '5px',
              paddingRight: '60px',
            }}
            isInvalid={!!formik.errors.canisterId && formik.touched.canisterId}
            isDisabled={false}
            value={formik.values.canisterId}
            onChange={(e) => formik.handleChange(e)}
          />
          <FormLabel color="grey.500" fontSize="15px">
            Backend Canister Id
          </FormLabel>
        </FormControl>
        <InputRightElement h="100%" w="45px" p="0">
          <Flex direction="column" h="100%" w="100%">
            <Button
              h="100%"
              fontSize="11px"
              borderRadius="0 5px 5px 0"
              bgColor="grey.500"
              color="grey.25"
              _hover={{ bg: 'grey.400', color: 'grey.25' }}
              onClick={() =>
                formik.setFieldValue(
                  'canisterId',
                  process.env.CANISTER_ID_ICRC_AUCTION,
                )
              }
            >
              Default
            </Button>
          </Flex>
        </InputRightElement>
      </InputGroup>
      {!!formik.errors.canisterId && formik.touched.canisterId && (
        <Text color="red.500" fontSize="12px">
          {formik.errors.canisterId}
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
              Save <Spinner ml={2} size="sm" color={fontColor} />
            </>
          ) : (
            'Save'
          )}
        </Button>
      </Flex>
    </>
  )
}

export default CanisterIdSettings
