import React, { useState } from 'react'

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDispatch } from 'react-redux'

import { AppDispatch } from '../../../../store'
import { seedAuthenticate } from '../../../../utils/authUtils'

interface SeedComponentProps {
  onClose: () => void
  isSelected?: boolean
  onAccordionChange: () => void
}

const SeedComponent: React.FC<SeedComponentProps> = ({
  onClose,
  isSelected,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')

  const [seed, setSeed] = useState('')
  const dispatch = useDispatch<AppDispatch>()

  const handleInputChange = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      await seedAuthenticate(seed, dispatch)
      onClose()
    }
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
                Seed (developers only)
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel p={4}>
            <FormControl variant="floating">
              <Input
                h="58px"
                placeholder=" "
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                onKeyDown={handleInputChange}
                sx={{ borderRadius: '5px' }}
                maxLength={32}
              />
              <FormLabel color="grey.500" fontSize="15px">
                Enter your seed
              </FormLabel>
            </FormControl>
          </AccordionPanel>
        </Box>
      </AccordionItem>
    </Accordion>
  )
}

export default SeedComponent
