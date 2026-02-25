import React, { useState } from 'react'

import { CopyIcon } from '@chakra-ui/icons'
import {
  Button,
  Heading,
  Text,
  Box,
  Image,
  Link,
  Checkbox,
  IconButton,
  useClipboard,
  useColorMode,
  useToast,
} from '@chakra-ui/react'
import { AuthClient } from '@icp-sdk/auth/client'
import { DerEncodedPublicKey } from '@icp-sdk/core/agent'
import {
  DelegationIdentity,
  Ed25519PublicKey,
  ECDSAKeyIdentity,
  DelegationChain,
} from '@icp-sdk/core/identity'
import { Select } from 'bymax-react-select'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'

import LogoDark from '../../assets/img/logo/dailyBid_black.svg'
import LogoLight from '../../assets/img/logo/dailyBid_white.svg'
import IILogo from '../../assets/img/logo/ii-logo.png'
import TelegramLogo from '../../assets/img/logo/telegram-logo.png'
import customStyles from '../../common/styles'
import useDPasteApi from '../../hooks/useDpasteApi'
import { Option } from '../../types'
import { getInternetIdentityDerivationOrigin } from '../../utils/canisterUtils'
import { hexToByteArray } from '../../utils/convertionsUtils'
import { generateAESKey, encrypt } from '../../utils/cryptoUtils'

let appPublicKey: Ed25519PublicKey | null = null

function getSessionKeyFromQuery(): string {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('sessionKey') || ''
}

const LoginII: React.FC = () => {
  const [userPrincipal, setUserPrincipal] = useState('')
  const [delegationCode, setDelegationCode] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [aesKey, setAesKey] = useState('')
  const [selectedTime, setSelectedTime] = useState<Option | null>({
    id: '720',
    value: '720',
    label: '30 days',
  })

  const { t } = useTranslation()
  const { saveToDpasteWithAuth } = useDPasteApi()

  const deepLink = `${process.env.ENV_TELEGRAM_DEEP_LINK}&startapp=${delegationCode}`
  const alternativeLink = `${process.env.ENV_TELEGRAM_ALTERNATIVE_LINK}?startapp=${delegationCode}`

  const { onCopy: onCopyDeepLink } = useClipboard(`${deepLink}_key-${aesKey}`)
  const { onCopy: onCopyAltLink } = useClipboard(
    `${alternativeLink}_key-${aesKey}`,
  )

  const { colorMode } = useColorMode()

  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })

  const handleCopy = (link: string) => {
    if (link === 'deepLink') onCopyDeepLink()
    else if (link === 'alternativeLink') onCopyAltLink()

    toast({
      title: t('Copied'),
      description: t('Link copied to clipboard.'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const selectOptions = [
    { id: '1', value: '0.0833', label: `5 ${t('minute')}s` },
    { id: '2', value: '0.25', label: `15 ${t('minute')}s` },
    { id: '3', value: '1', label: `1 ${t('hour')}` },
    { id: '4', value: '3', label: `3 ${t('hour')}s` },
    { id: '5', value: '12', label: `12 ${t('hour')}s` },
    { id: '6', value: '24', label: `1 ${t('day')}` },
    { id: '7', value: '168', label: `7 ${t('day')}s` },
    { id: '8', value: '720', label: `30 ${t('day')}s` },
  ]

  const handleLoginDurationOptionChange = (
    option: Option | Option[] | null,
  ) => {
    const optionValue =
      Array.isArray(option) && option.length > 0
        ? option[0]
        : (option as Option | null)

    if (optionValue && optionValue !== undefined && optionValue.value) {
      setSelectedTime(optionValue)
    }
  }

  type DelegationChain = {
    delegations: any[]
  }

  const updateDelegations = (
    data: DelegationChain,
    newDelegation: any[],
  ): DelegationChain => {
    return {
      ...data,
      delegations: [...data.delegations, ...newDelegation],
    }
  }
  const removeDelegationAtIndex = (data: any, indexToRemove: number): any => {
    return {
      ...data,
      delegations: data.delegations.filter(
        (_: any, index: number) => index !== indexToRemove,
      ),
    }
  }

  const handleClick = async () => {
    let delegationChain

    const newTab = window.open('about:blank', '_blank')

    if (!newTab) {
      alert(t('Popup blocked! Please allow pop-ups and try again.'))
      return
    }

    const originalWindowOpen = window.open
    window.open = function (url, target) {
      if (newTab && !newTab.closed) {
        if (url) {
          newTab.location.href = url.toString()
        }
        return newTab
      }
      return originalWindowOpen(url, target)
    }

    try {
      const appPublicKeyDer = hexToByteArray(getSessionKeyFromQuery())
      appPublicKey = Ed25519PublicKey.fromDer(
        appPublicKeyDer as unknown as DerEncodedPublicKey,
      )

      const middleKeyIdentity = await ECDSAKeyIdentity.generate()
      const authClient = await AuthClient.create({
        identity: middleKeyIdentity,
      })

      const AUTH_EXPIRATION_INTERNET_IDENTITY = BigInt(
        Number(selectedTime?.value) * 60 * 60 * 1000 * 1000 * 1000,
      )

      await new Promise((resolve) => {
        authClient.login({
          maxTimeToLive: AUTH_EXPIRATION_INTERNET_IDENTITY,
          identityProvider: `${process.env.HTTP_AGENT_HOST}/#authorize`,
          derivationOrigin: process.env.ENV_AUTH_DERIVATION_ORIGIN,
          onSuccess: resolve,
        })
      })

      const middleIdentity = authClient.getIdentity()
      setUserPrincipal(middleIdentity.getPrincipal().toText())

      if (
        appPublicKey != null &&
        middleIdentity instanceof DelegationIdentity
      ) {
        try {
          const middleToApp = await DelegationChain.create(
            middleKeyIdentity,
            appPublicKey,
            new Date(Date.now() + Number(selectedTime?.value) * 60 * 60 * 1000),
            { previous: middleIdentity.getDelegation() },
          )

          delegationChain = middleToApp
        } catch (error: any) {
          console.error('Failed to create delegation chain:', error.message)
        }
      }

      if (delegationChain) {
        const delegationChainConverted = JSON.parse(
          JSON.stringify(delegationChain),
        )

        const delegationRemoved = removeDelegationAtIndex(
          delegationChainConverted,
          1,
        )

        const pubkey = delegationChainConverted.delegations[1].delegation.pubkey

        const signature = delegationChainConverted.delegations[1].signature

        const param = `${delegationChain.delegations[1].delegation.expiration}_${pubkey}_${signature}`

        const newDelegation = {
          delegation: {
            expiration: '11',
            pubkey,
          },
          signature,
        }

        const delegationsUpdated = updateDelegations(delegationRemoved, [
          newDelegation,
        ])

        console.log('delegationsUpdated', delegationsUpdated)

        console.log('delegationChain', delegationChain)

        console.log('delegationChain String', JSON.stringify(delegationChain))

        console.log(
          'delegationChain String Parse',
          JSON.parse(JSON.stringify(delegationChain)),
        )

        console.log('delegation removed', delegationRemoved)

        console.log(
          'delegation removed string',
          JSON.stringify(delegationRemoved),
        )

        console.log('param', param)

        const returnTo = process.env.ENV_TELEGRAM_DEEP_LINK
        //const returnTo = 'https://alpha.daily-bid.com?'

        const genAesKey = await generateAESKey()
        const genAesKeyUint8Array = new Uint8Array(
          Buffer.from(genAesKey, 'hex'),
        )
        setAesKey(genAesKey)

        const delegationEncrypted = encrypt(
          JSON.stringify(delegationChain),
          genAesKeyUint8Array,
        )

        const delegationCodeDPaste =
          await saveToDpasteWithAuth(delegationEncrypted)

        setDelegationCode(delegationCodeDPaste)

        const miniAppUrl = `${returnTo}&startapp=${delegationCodeDPaste}_key-${genAesKey}_${param}`
        //const miniAppUrl = `${returnTo}startapp=${delegationCodeDPaste}_key-${genAesKey}_${param}`

        window.location.href = miniAppUrl

        window.onblur = () => {
          window.onfocus = () => {
            //setTimeout(() => window.close(), 1000)
          }
        }
      } else {
        console.error('Delegation chain is undefined.')
      }
    } catch (error) {
      console.error('Error during login:', error)
      newTab.close()
    }

    setTimeout(() => {
      window.open = originalWindowOpen
    }, 5000)
  }

  return (
    <Box
      textAlign="center"
      width="100%"
      height={{ base: '80vh', md: '90vh' }}
      paddingTop={{ base: '16px', md: '0' }}
      paddingBottom={{ base: '16px', md: '0' }}
    >
      <Helmet title="DailyBid login for Telegram mini app" />
      <Heading as="h1" size="2xl" fontWeight="bold" mb={6}>
        Internet Identity
      </Heading>

      <Heading as="h1" size="2xl" fontWeight="bold">
        {t('Login for mini dApps')}
      </Heading>

      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
        margin="auto"
        mt={6}
        mb={6}
      >
        <Image
          src={colorMode === 'dark' ? LogoLight : LogoDark}
          alt="DailyBid"
          height="64px"
          width="200px"
        />
      </Box>

      {userPrincipal && (
        <>
          <Text fontSize="lg" fontWeight="normal" mb={8}>
            {t('You have been redirected to Telegram. Click')}{' '}
            <Link as="button" onClick={() => window.close()} color="inherit">
              {t('here')}
            </Link>{' '}
            {t('to close this tab')}:
          </Text>

          <Button colorScheme="blue" size="lg" onClick={() => window.close()}>
            {t('Close')}
          </Button>

          <Text fontSize="lg" fontWeight="normal" mt={8}>
            {t('If the redirection did not work you can try to click')}{' '}
            <Link href={`${deepLink}_key-${aesKey}`} color="inherit">
              {t('here')}
            </Link>{' '}
            {t('or')}{' '}
            <Link href={`${alternativeLink}_key-${aesKey}`} color="inherit">
              {t('here')}
            </Link>
            .
          </Text>
        </>
      )}

      {!userPrincipal && (
        <>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="auto"
            mb={8}
          >
            <Box justifyContent="center" alignItems="center" width="300px">
              <Select
                id="loginDuration"
                value={selectedTime}
                isMulti={false}
                isClearable={false}
                isLocked={!!userPrincipal}
                options={selectOptions}
                placeholder="Stay logged in for"
                noOptionsMessage="No data"
                onChange={handleLoginDurationOptionChange}
                styles={customStyles as any}
              />
            </Box>
          </Box>

          <Button colorScheme="blue" size="lg" onClick={handleClick}>
            Login
          </Button>
        </>
      )}

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        margin="auto"
        mt={10}
      >
        <Checkbox
          isChecked={showDetails}
          onChange={(e) => setShowDetails(e.target.checked)}
          colorScheme="blue"
        >
          {t('Show details')}
        </Checkbox>
      </Box>

      {showDetails && userPrincipal && (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          width="auto"
          mt={8}
        >
          <Box justifyContent="center" alignItems="center" width="300px">
            <Select
              id="loginDuration"
              value={selectedTime}
              isMulti={false}
              isClearable={false}
              isLocked={!!userPrincipal}
              options={selectOptions}
              placeholder="Stay logged in for"
              noOptionsMessage="No data"
              onChange={handleLoginDurationOptionChange}
              styles={customStyles as any}
            />
          </Box>
        </Box>
      )}

      {showDetails && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="flex-start"
          maxWidth="900px"
          width="100%"
          margin="auto"
          top="0"
          left="0"
          right="0"
          padding="16px"
          overflowX="auto"
          whiteSpace="nowrap"
        >
          <Box
            textAlign="right"
            pr={4}
            minWidth="150px"
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="right"
              mt={2}
            >
              <Text fontSize="lg" fontWeight="normal">
                Derivation Origin:
              </Text>
            </Box>
            {userPrincipal && (
              <>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="right"
                  mt={2}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    User Principal:
                  </Text>
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="right"
                  mt={2}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    Deep Link:
                  </Text>
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="right"
                  mt={3}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    Alternative Link:
                  </Text>
                </Box>
              </>
            )}
          </Box>

          <Box
            textAlign="left"
            pl={4}
            minWidth="250px"
            display="flex"
            flexDirection="column"
          >
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="left"
              mt={2}
            >
              <Text fontSize="lg" fontWeight="normal">
                {getInternetIdentityDerivationOrigin()}
              </Text>
            </Box>

            {userPrincipal && (
              <>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="left"
                  mt={2}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    {userPrincipal}
                  </Text>
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="left"
                  mt={2}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    <Link href={`${deepLink}_key-${aesKey}`} isExternal>
                      {deepLink}
                    </Link>
                    <IconButton
                      aria-label="Copy link"
                      icon={<CopyIcon />}
                      size="sm"
                      onClick={() => handleCopy('deepLink')}
                      ml={1}
                      variant="ghost"
                    />
                  </Text>
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="left"
                  mt={2}
                >
                  <Text fontSize="lg" fontWeight="normal">
                    <Link href={`${alternativeLink}_key-${aesKey}`} isExternal>
                      {alternativeLink}
                    </Link>
                    <IconButton
                      aria-label="Copy link"
                      icon={<CopyIcon />}
                      size="sm"
                      onClick={() => handleCopy('alternativeLink')}
                      ml={1}
                      variant="ghost"
                    />
                  </Text>
                </Box>
              </>
            )}
          </Box>
        </Box>
      )}

      <Box
        display="flex"
        flexDirection={{ base: 'column', md: 'row' }}
        justifyContent="center"
        alignItems="center"
        width="100%"
        margin="auto"
        mt={8}
        padding="16px"
        overflowX="auto"
        whiteSpace="nowrap"
      >
        <Image
          src={colorMode === 'dark' ? LogoLight : LogoDark}
          alt="DailyBid"
          height="64px"
          width="200px"
          mb={{ base: 4, md: 0 }}
        />
        <Image
          src={TelegramLogo}
          alt="Telegram"
          boxSize="55px"
          ml={{ base: 0, md: 4 }}
          mb={{ base: 4, md: 0 }}
        />
        <Image
          src={IILogo}
          alt="Internet Identity"
          height="64px"
          width="250px"
          ml={{ base: 0, md: 4 }}
        />
      </Box>
    </Box>
  )
}

export default LoginII
