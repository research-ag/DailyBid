import React, { useState, useEffect } from 'react'

import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  Box,
  Flex,
  Button,
  Text,
  Portal,
} from '@chakra-ui/react'
import { Global } from '@emotion/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useSiws } from 'ic-siws-js/react'
import { useDispatch } from 'react-redux'

import walletAdapterChakraGlobal from './wallet-adapter-chakra-global'
import { AppDispatch } from '../../../../store'
import { siwsAuthenticate } from '../../../../utils/authUtils'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

interface SolanaComponentProps {
  onClose: () => void
  currentIndex: number | null
  onAccordionChange: (index: number) => void
}

const SolanaComponent: React.FC<SolanaComponentProps> = ({
  onClose,
  currentIndex,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const [isLoading, setIsLoading] = useState(false)

  const dispatch = useDispatch<AppDispatch>()

  const { wallet, publicKey } = useWallet()
  const { login, loginStatus, identity } = useSiws()

  // Simplified function to open the wallet modal
  const handleOpenWalletModal = () => {
    setIsLoading(true)

    // Find all buttons in the DOM that could control the wallet modal
    const walletButtons = document.querySelectorAll(
      '.wallet-adapter-button-trigger',
    )

    if (walletButtons.length > 0) {
      // Fire the click event on the button we found
      walletButtons[0].dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (identity) {
      siwsAuthenticate(dispatch, identity)
      onClose()
    }
  }, [identity])

  return (
    <>
      <Global styles={walletAdapterChakraGlobal} />
      <Accordion
        allowToggle
        index={currentIndex === 3 ? [0] : []}
        onChange={() => onAccordionChange(3)}
      >
        <AccordionItem border="none">
          <Box
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
          >
            <h2>
              <AccordionButton _expanded={{ bg: bgColor, color: fontColor }}>
                <Box as="span" flex="1" textAlign="left">
                  Solana Wallet
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel p={4}>
              <Flex direction="column" gap={4}>
                {!wallet || !publicKey ? (
                  <Flex direction="column" width="100%">
                    <Button
                      background={bgColor}
                      variant="solid"
                      h="58px"
                      color={fontColor}
                      _hover={{
                        bg: bgColorHover,
                        color: fontColor,
                      }}
                      width="100%"
                      onClick={handleOpenWalletModal}
                    >
                      {loginStatus === 'logging-in'
                        ? 'Connecting…'
                        : 'Connect Wallet'}
                    </Button>

                    {/* Original button hidden */}
                    <Portal>
                      <Box
                        position="absolute"
                        visibility="hidden"
                        opacity="0"
                        pointerEvents="none"
                      >
                        <WalletMultiButton />
                      </Box>
                    </Portal>
                  </Flex>
                ) : (
                  <>
                    <Text fontSize="sm" color={fontColor}>
                      Wallet connected:{' '}
                      {publicKey &&
                        `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`}
                    </Text>
                    <Button
                      background={bgColor}
                      variant="solid"
                      h="58px"
                      color={fontColor}
                      _hover={{
                        bg: bgColorHover,
                        color: fontColor,
                      }}
                      isLoading={isLoading}
                      isDisabled={isLoading || !login}
                      onClick={login}
                    >
                      Sign In With Solana
                    </Button>
                  </>
                )}
              </Flex>
            </AccordionPanel>
          </Box>
        </AccordionItem>
      </Accordion>
    </>
  )
}

export default SolanaComponent
