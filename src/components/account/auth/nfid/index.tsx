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

import { AppDispatch } from '../../../../store'
import { identityAuthenticate } from '../../../../utils/authUtils'

interface NfidComponentProps {
  onClose: () => void
  ownIndex: number
  currentIndex: number | null
  onAccordionChange: (index: number) => void
}

const NfidComponent: React.FC<NfidComponentProps> = ({
  onClose,
  ownIndex,
  currentIndex,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')

  const dispatch = useDispatch<AppDispatch>()

  const handleClick = async () => {
    await identityAuthenticate(dispatch, 'NFID')
    onClose()
  }

  return (
    <Accordion
      allowToggle
      index={currentIndex === ownIndex ? [0] : []}
      onChange={() => onAccordionChange(ownIndex)}
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
                NFID
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

export default NfidComponent
