import React, { useState, useMemo, useEffect } from 'react'

import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  Box,
  Flex,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react'
import * as bip39 from 'bip39'
import { useDispatch } from 'react-redux'

import useWindow from '../../../../hooks/useWindow'
import { AppDispatch } from '../../../../store'
import { mnemonicAuthenticate } from '../../../../utils/authUtils'
import { encrypt, decrypt } from '../../../../utils/cryptoUtils'

interface MnemonicComponentProps {
  onClose: () => void
  currentIndex: number | null
  onAccordionChange: (index: number) => void
}

const MnemonicComponent: React.FC<MnemonicComponentProps> = ({
  onClose,
  currentIndex,
  onAccordionChange,
}) => {
  const bgColor = useColorModeValue('grey.200', 'grey.600')
  const fontColor = useColorModeValue('grey.900', 'grey.25')
  const borderColor = useColorModeValue('grey.300', 'grey.700')
  const bgColorHover = useColorModeValue('grey.300', 'grey.500')

  const { getIsTelegramApp } = useWindow()
  const { isTelegram } = getIsTelegramApp()

  const [seed, setSeed] = useState<string>('')
  const [seedLocalStorage, setSeedLocalStorage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const dispatch = useDispatch<AppDispatch>()

  const wordList = useMemo(() => {
    let words: string[] = []
    for (const key in bip39.wordlists) {
      words = words.concat(bip39.wordlists[key])
    }
    return words
  }, [])

  const sanitizePhrase = (phrase: string): string[] =>
    phrase.split(' ').filter((chunk) => chunk.trim() !== '')

  const isPhraseValid = useMemo(() => {
    const sanitizedPhrase = sanitizePhrase(seed)
    if (sanitizedPhrase.length < 12 || sanitizedPhrase.length > 24) return false
    return sanitizedPhrase.every((word) => wordList.includes(word))
  }, [seed, wordList])

  const generateMnemonicPhrase = (): string => {
    return bip39.generateMnemonic(256)
  }

  const validateAndLogin = async () => {
    try {
      setErrorMessage(null)
      const sanitizedPhrase = sanitizePhrase(seed)
      await mnemonicAuthenticate(sanitizedPhrase, dispatch)
      if (isTelegram) localStorage.setItem('mnemonicPhrase', encrypt(seed))
      setSeed('')
      onClose()
    } catch (error) {
      setErrorMessage('Authentication failed. Please try again.')
    }
  }

  useEffect(() => {
    if (!seed) {
      setErrorMessage(null)
      return
    }
    if (!isPhraseValid) {
      setErrorMessage(
        seed.trim().length === 0
          ? null
          : 'Invalid mnemonic phrase. Please check your input.',
      )
    } else {
      setErrorMessage(null)
    }
  }, [isPhraseValid, seed])

  useEffect(() => {
    if (isTelegram) {
      const localStorageSaved = localStorage.getItem('mnemonicPhrase')
      if (localStorageSaved) {
        const seed = decrypt(localStorageSaved)
        setSeedLocalStorage(seed)
        setSeed(seed)
      }
    }
  }, [isTelegram])

  return (
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
                Mnemonic
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel p={4}>
            {!seedLocalStorage ? (
              <FormControl variant="floating">
                <Input
                  h="58px"
                  placeholder=" "
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  sx={{ borderRadius: '5px' }}
                />
                <FormLabel color="grey.500" fontSize="15px">
                  Suggested phrase between 12 and 24 words
                </FormLabel>
                {errorMessage && (
                  <Text color="red.500" fontSize="12px">
                    {errorMessage}
                  </Text>
                )}
              </FormControl>
            ) : (
              <Flex direction="column" mt={!seedLocalStorage ? 4 : 0} mb={4}>
                <Button
                  background={bgColor}
                  variant="solid"
                  h="58px"
                  color={fontColor}
                  _hover={{
                    bg: bgColorHover,
                    color: fontColor,
                  }}
                  onClick={() => {
                    setSeedLocalStorage(''), setSeed('')
                  }}
                >
                  Enter new Mnemonic
                </Button>
              </Flex>
            )}
            <Flex direction="column" mt={!seedLocalStorage ? 4 : 0}>
              <Button
                background={bgColor}
                variant="solid"
                h="58px"
                color={fontColor}
                _hover={{
                  bg: bgColorHover,
                  color: fontColor,
                }}
                isDisabled={
                  !(
                    (isTelegram && !seedLocalStorage && !seed) ||
                    (isPhraseValid && seed.length > 0) ||
                    (!isTelegram && seedLocalStorage)
                  )
                }
                onClick={() => {
                  if (!seedLocalStorage && !seed && isTelegram) {
                    const newMnemonic = generateMnemonicPhrase()
                    setSeed(newMnemonic)
                  } else {
                    validateAndLogin()
                  }
                }}
              >
                {!seedLocalStorage && !seed && isTelegram
                  ? 'Generate new Mnemonic'
                  : seedLocalStorage && isTelegram
                    ? 'Use stored Mnemonic'
                    : 'Log in'}
              </Button>
            </Flex>
          </AccordionPanel>
        </Box>
      </AccordionItem>
    </Accordion>
  )
}

export default MnemonicComponent
