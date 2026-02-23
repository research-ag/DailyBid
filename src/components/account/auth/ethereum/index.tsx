import React, { useState } from 'react'

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
  useToast,
} from '@chakra-ui/react'
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { useSiwe } from 'ic-siwe-js/react'
import { useDispatch } from 'react-redux'
import { useAccount } from 'wagmi'

import { AppDispatch } from '../../../../store'
import { siweAuthenticate } from '../../../../utils/authUtils'

interface EthereumComponentProps {
  onClose: () => void
  currentIndex: number | null
  onAccordionChange: (index: number) => void
}

const EthereumComponent: React.FC<EthereumComponentProps> = ({
  onClose,
  currentIndex,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast({
    duration: 10000,
    position: 'top-right',
    isClosable: true,
  })

  const dispatch = useDispatch<AppDispatch>()
  const { openConnectModal, connectModalOpen } = useConnectModal()
  const { openAccountModal } = useAccountModal()
  const { isConnected, address } = useAccount()
  const { login, isInitializing } = useSiwe()

  const handleConnect = () => {
    if (isConnected) {
      openAccountModal?.()
    } else {
      openConnectModal?.()
    }
  }

  const handleLogin = async () => {
    if (!isConnected) {
      toast({
        title: 'No wallet connected',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!address) {
      toast({
        title: 'No wallet address',
        description: 'Could not get wallet address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      setIsLoading(true)

      if (!login) {
        throw new Error('SIWE login function not available')
      }

      // Wrap the login function in a try-catch to get more specific error information
      try {
        // This calls the correct function from authUtils that matches the original project
        await siweAuthenticate(dispatch, login)

        onClose()
      } catch (loginError) {
        console.error('Specific login error:', loginError)
        throw new Error(
          `SIWE authentication failed: ${loginError instanceof Error ? loginError.message : 'Unknown error'}`,
        )
      }
    } catch (error) {
      console.error('Error during login:', error)

      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Accordion
      allowToggle
      index={currentIndex === 2 ? [0] : []}
      onChange={() => onAccordionChange(2)}
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
                Ethereum Wallet
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel p={4}>
            <Flex direction="column" gap={4}>
              {!isConnected ? (
                <Button
                  background={bgColor}
                  variant="solid"
                  h="58px"
                  color={fontColor}
                  _hover={{
                    bg: bgColorHover,
                    color: fontColor,
                  }}
                  isDisabled={connectModalOpen}
                  onClick={handleConnect}
                >
                  Connect Wallet
                </Button>
              ) : (
                <>
                  <Text fontSize="sm" color={fontColor}>
                    Wallet connected:{' '}
                    {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
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
                    isLoading={isLoading || isInitializing}
                    isDisabled={isInitializing || !login}
                    onClick={handleLogin}
                  >
                    Sign In With Ethereum
                  </Button>
                </>
              )}
            </Flex>
          </AccordionPanel>
        </Box>
      </AccordionItem>
    </Accordion>
  )
}

export default EthereumComponent
