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
} from '@chakra-ui/react'
import { useDispatch, useSelector } from 'react-redux'

import IdentityComponent from './auth/identity'
import MnemonicComponent from './auth/mnemonic'
import NfidComponent from './auth/nfid'
import SeedComponent from './auth/seed'
import WalletComponent from './wallet'
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
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [showOtherLogins, setShowOtherLogins] = useState<boolean>(false)

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
            _hover={{
              bg: bgColorHover,
            }}
          />
          {isAuthenticated ? (
            <DrawerHeader>Account details</DrawerHeader>
          ) : (
            <DrawerHeader>Log in with</DrawerHeader>
          )}

          <DrawerBody>
            {isAuthenticated ? (
              <WalletComponent />
            ) : (
              <Box>
                <Box>
                  <IdentityComponent
                    onClose={onClose}
                    label={'Internet Identity'}
                    ownIndex={0}
                    currentIndex={activeIndex}
                    onAccordionChange={() => handleAccordionChange(0)}
                  />
                </Box>
                {!!process.env.HTTP_AGENT_HOST_2 && (
                  <Box mt={4}>
                    <IdentityComponent
                      onClose={onClose}
                      label={'Internet Identity 2.0'}
                      ownIndex={1}
                      currentIndex={activeIndex}
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
                        ownIndex={2}
                        currentIndex={activeIndex}
                        onAccordionChange={() => handleAccordionChange(2)}
                      />
                    </Box>
                    <Box mt={4}>
                      <SeedComponent
                        onClose={onClose}
                        ownIndex={3}
                        currentIndex={activeIndex}
                        onAccordionChange={() => handleAccordionChange(3)}
                      />
                    </Box>
                  </>
                )}
                <Box mt={4}>
                  <MnemonicComponent
                    onClose={onClose}
                    ownIndex={4}
                    currentIndex={activeIndex}
                    onAccordionChange={() => handleAccordionChange(4)}
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
