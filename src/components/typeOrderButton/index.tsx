'use client'

import { useState, useRef, useEffect } from 'react'

import { Text, Box, Flex, useColorModeValue } from '@chakra-ui/react'

interface TypeOrderButtonProps {
  firstOption: string
  secondOption: string
  onChange: (value: string) => void
  initialActive?: 'first' | 'second'
}

export default function TypeOrderButton({
  firstOption,
  secondOption,
  onChange,
  initialActive = 'first',
}: TypeOrderButtonProps) {
  const [active, setActive] = useState<'first' | 'second'>(initialActive)
  const [lineStyle, setLineStyle] = useState<{
    left: string
    width: string
    transition?: string
  } | null>(null)
  const firstButtonRef = useRef<HTMLDivElement>(null)
  const secondButtonRef = useRef<HTMLDivElement>(null)
  const fontActiveColor = useColorModeValue('grey.700', 'grey.100')
  const fontInactiveColor = useColorModeValue('grey.400', 'grey.300')
  const borderActiveColor = useColorModeValue('grey.900', 'grey.100')

  const updateLinePosition = () => {
    const activeRef = active === 'first' ? firstButtonRef : secondButtonRef
    if (activeRef.current) {
      const { offsetLeft, offsetWidth } = activeRef.current
      setLineStyle({
        left: `${offsetLeft - 10}px`,
        width: `${offsetWidth + 20}px`,
      })
    }
  }

  useEffect(() => {
    updateLinePosition()

    // Add resize event listener to update line position on window resize
    window.addEventListener('resize', updateLinePosition)

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', updateLinePosition)
    }
  }, [active])

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    onChangeRef.current(active === 'first' ? firstOption : secondOption)
  }, [active])

  return (
    <Flex position="relative" w="full">
      <Flex w="100%" justifyContent="center">
        <Flex gap={8}>
          <Flex
            ref={firstButtonRef}
            cursor="pointer"
            onClick={() => setActive('first')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && setActive('first')
            }
            aria-pressed={active === 'first'}
            pb={2}
          >
            <Text
              fontSize="md"
              fontWeight={active === 'first' ? 'bold' : 'normal'}
              color={active === 'first' ? fontActiveColor : fontInactiveColor}
            >
              {firstOption}
            </Text>
          </Flex>

          <Flex
            ref={secondButtonRef}
            cursor="pointer"
            onClick={() => setActive('second')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && setActive('second')
            }
            aria-pressed={active === 'second'}
            pb={2}
          >
            <Text
              fontSize="md"
              fontWeight={active === 'second' ? 'bold' : 'normal'}
              color={active === 'second' ? fontActiveColor : fontInactiveColor}
            >
              {secondOption}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      {/* Static line spanning full width */}
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        h="1px"
        bg="grey.400"
        zIndex={0}
      />

      {/* Animated active indicator line */}
      <Box
        position="absolute"
        bottom="0"
        h="2px"
        bg={borderActiveColor}
        transition="left 0.3s ease-in-out, width 0.3s ease-in-out"
        style={lineStyle ?? {}}
        zIndex={1}
      />
    </Flex>
  )
}
