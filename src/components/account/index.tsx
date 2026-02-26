import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Link,
  useColorModeValue,
  Flex,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { useSiws } from 'ic-siws-js/react'
import { FiBell, FiBellOff } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'

import EthereumComponent from './auth/ethereum'
import IdentityComponent from './auth/identity'
import MnemonicComponent from './auth/mnemonic'
import NfidComponent from './auth/nfid'
import SeedComponent from './auth/seed'
import SolanaComponent from './auth/solana'
import WalletComponent from './wallet'
import useWebPushNotifications from '../../hooks/useWebPushNotifications'
import useWindow from '../../hooks/useWindow'
import { RootState } from '../../store'
import { logout } from '../../store/auth'
import { analytics } from '../../utils/mixpanelUtils'

interface AccountComponentProps {
  isOpen: boolean
  onClose: () => void
}

const AccountComponent: React.FC<AccountComponentProps> = ({
  isOpen,
  onClose,
}) => {
  const notifications = useWebPushNotifications()
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showOtherLogins, setShowOtherLogins] = useState<boolean>(false)

  const { clear } = useSiws()

  const dispatch = useDispatch()
  const { getIsTelegramApp } = useWindow()
  const { isTelegram, isTelegramWeb } = getIsTelegramApp()
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  )
  const userPrincipal = useSelector(
    (state: RootState) => state.auth.userPrincipal,
  )
  const handleLogout = () => {
    dispatch(logout())
    clear()
    // Mixpanel event tracking [User Logged Out]
    analytics.userLoggedOut(userPrincipal)
    localStorage.removeItem('identity')
    localStorage.removeItem('delegationIdentity')
    localStorage.removeItem('mnemonicPhrase')
    localStorage.removeItem('ckBtcUtxo')
    onClose()
  }

  const handleAccordionChange = (index: number) => {
    setActiveIndex(index === activeIndex ? null : index)
  }

  const handleShowOtherLogins = () => {
    setShowOtherLogins((prev) => !prev)
  }

  useEffect(() => {
    if (isTelegram && !isTelegramWeb) {
      setActiveIndex(3)
    }
  }, [isTelegram])

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton
            top={4}
            _hover={{
              bg: bgColorHover,
            }}
          />
          <DrawerHeader pr={14}>
            <Flex align="center" justify="space-between" gap={3}>
              <Box>{isAuthenticated ? 'Account details' : 'Log in with'}</Box>
              {isAuthenticated && (
                <Tooltip
                  label={
                    !notifications.canUse
                      ? 'Login to manage notifications'
                      : notifications.isSubscribed
                        ? 'Disable notifications'
                        : 'Enable notifications'
                  }
                >
                  <IconButton
                    aria-label={
                      notifications.isSubscribed
                        ? 'Disable notifications'
                        : 'Enable notifications'
                    }
                    aria-pressed={notifications.isSubscribed}
                    size="sm"
                    onClick={() =>
                      notifications.isSubscribed
                        ? notifications.disable()
                        : notifications.enable()
                    }
                    isDisabled={
                      !notifications.canUse ||
                      notifications.loading ||
                      notifications.enabling ||
                      notifications.disabling
                    }
                    isLoading={
                      notifications.enabling || notifications.disabling
                    }
                    icon={
                      notifications.isSubscribed ? <FiBell /> : <FiBellOff />
                    }
                    variant="ghost"
                  />
                </Tooltip>
              )}
            </Flex>
          </DrawerHeader>

          <DrawerBody>
            {isAuthenticated ? (
              <WalletComponent />
            ) : (
              <Box>
                <Box>
                  <IdentityComponent
                    onClose={onClose}
                    label={'Internet Identity'}
                    isSelected={activeIndex === 0}
                    onAccordionChange={() => handleAccordionChange(0)}
                  />
                </Box>
                {!!process.env.HTTP_AGENT_HOST_2 && (
                  <Box mt={4}>
                    <IdentityComponent
                      onClose={onClose}
                      label={'Internet Identity 2.0'}
                      isSelected={activeIndex === 1}
                      identityProvider={process.env.HTTP_AGENT_HOST_2}
                      onAccordionChange={() => handleAccordionChange(1)}
                    />
                  </Box>
                )}
                {(!isTelegram || isTelegramWeb || showOtherLogins) && (
                  <>
                    <Box mt={4}>
                      <NfidComponent
                        onClose={onClose}
                        isSelected={activeIndex === 2}
                        onAccordionChange={() => handleAccordionChange(2)}
                      />
                    </Box>
                    <Box mt={4}>
                      <EthereumComponent
                        onClose={onClose}
                        isSelected={activeIndex === 3}
                        onAccordionChange={() => handleAccordionChange(3)}
                      />
                    </Box>
                    <Box mt={4}>
                      <SolanaComponent
                        onClose={onClose}
                        isSelected={activeIndex === 4}
                        onAccordionChange={() => handleAccordionChange(4)}
                      />
                    </Box>
                    <Box mt={4}>
                      <SeedComponent
                        onClose={onClose}
                        isSelected={activeIndex === 5}
                        onAccordionChange={() => handleAccordionChange(5)}
                      />
                    </Box>
                  </>
                )}
                <Box mt={4}>
                  <MnemonicComponent
                    onClose={onClose}
                    isSelected={activeIndex === 6}
                    onAccordionChange={() => handleAccordionChange(6)}
                  />
                </Box>
                {isTelegram && !isTelegramWeb && (
                  <Box display="flex" mt={4} mr={5} justifyContent="flex-end">
                    <Link
                      as="button"
                      textDecoration="underline"
                      onClick={handleShowOtherLogins}
                      fontSize="13px"
                    >
                      {!showOtherLogins
                        ? 'Experimental Logins'
                        : 'Default Logins'}
                    </Link>
                  </Box>
                )}
              </Box>
            )}
          </DrawerBody>

          <DrawerFooter>
            {isAuthenticated && (
              <Box flex="1" textAlign="right">
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default AccountComponent
