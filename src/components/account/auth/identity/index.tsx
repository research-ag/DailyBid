import React from 'react'

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch } from 'react-redux'

import useWindow from '../../../../hooks/useWindow'
import { AppDispatch } from '../../../../store'
import {
  generatePublicKey,
  identityAuthenticate,
} from '../../../../utils/authUtils'
import { customPopup, getDeviceType } from '../../../../utils/deviceUtils'

interface IdentityComponentProps {
  onClose: () => void
  isSelected?: boolean
  label: string
  identityProvider?: string
  onAccordionChange: () => void
}

const IdentityComponent: React.FC<IdentityComponentProps> = ({
  onClose,
  isSelected,
  label,
  identityProvider,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')

  const { getIsTelegramApp } = useWindow()
  const { isTelegram, isTelegramWeb } = getIsTelegramApp()
  const dispatch = useDispatch<AppDispatch>()

  const handleClick = async () => {
    if (isTelegram && !isTelegramWeb) {
      const { identity, publicKey } = generatePublicKey()
      localStorage.setItem('identity', JSON.stringify(identity.toJSON()))

      window.Telegram.WebApp.openLink(
        //window.open(
        `${process.env.ENV_LOGIN_II_PROXY_PAGE_LINK}?sessionKey=${publicKey}`,
      )
    } else {
      try {
        const deviceType = getDeviceType()
        if (deviceType === 'desktop') {
          await identityAuthenticate(dispatch, 'IC', identityProvider)
        } else {
          await customPopup(() => identityAuthenticate(dispatch, 'IC', identityProvider))
        }
      } catch (error) {
        alert(error)
      }
    }
    onClose()
  }

  return (
    <Accordion
      allowToggle
      index={isSelected ? [0] : []}
      onChange={() => onAccordionChange()}
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
                {label}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel p={4}>
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
                isDisabled={false}
                onClick={handleClick}
              >
                Log in
              </Button>
            </Flex>
          </AccordionPanel>
        </Box>
      </AccordionItem>
    </Accordion>
  )
}

export default IdentityComponent
