import React, { useState } from 'react'

import { SearchIcon } from '@chakra-ui/icons'
import {
  Flex,
  InputGroup,
  Input,
  InputLeftElement,
  Progress,
} from '@chakra-ui/react'
import { HttpAgent } from '@icp-sdk/core/agent'

import TokenRow from './tokenRow'
import { TokenDataItem, TokenMetadata } from '../../../../types'

interface TokenTabProps {
  balances: TokenDataItem[]
  userAgent: HttpAgent
  userPrincipal: string
  handleNotify: (principal: string | undefined, base: string) => void
  handleWithdraw: (
    amount: number,
    account: string | undefined,
    token: TokenMetadata,
    network: string | null,
  ) => void
  handleDeposit: (
    amount: number,
    account: string | undefined,
    token: TokenMetadata,
  ) => void
  showSearch?: boolean
  loading: boolean
}

const TokenTab: React.FC<TokenTabProps> = ({
  balances,
  userAgent,
  userPrincipal,
  handleNotify,
  handleWithdraw,
  handleDeposit,
  showSearch = false,
  loading,
}) => {
  const [filter, setFilter] = useState('')
  const [activeBase, setActiveBase] = useState<string | null>(null)

  const filteredBalances = balances.filter((token) =>
    token.base.toLowerCase().includes(filter.toLowerCase()),
  )

  const handleAccordionChange = (base: string) => {
    setActiveBase((prev) => (prev === base ? null : base))
  }

  return (
    <>
      {showSearch && (
        <Flex justifyContent="flex-end" alignItems="center">
          <InputGroup size="xs" width="50%">
            <Input
              placeholder="Search"
              value={filter || ''}
              onChange={(e) => setFilter(e.target.value)}
              pr="2.5rem"
            />
            <InputLeftElement>
              <SearchIcon />
            </InputLeftElement>
          </InputGroup>
        </Flex>
      )}

      {loading && filteredBalances?.length <= 0 ? (
        <Flex justify="center" align="center" h="100px">
          <Progress size="xs" isIndeterminate w="90%" />
        </Flex>
      ) : (
        filteredBalances.map((token) => (
          <TokenRow
            key={token.base}
            token={token}
            userAgent={userAgent}
            userPrincipal={userPrincipal}
            handleNotify={handleNotify}
            handleWithdraw={handleWithdraw}
            handleDeposit={handleDeposit}
            currentIndex={activeBase === token.base ? 0 : undefined}
            onAccordionChange={() => handleAccordionChange(token.base)}
          />
        ))
      )}
    </>
  )
}

export default TokenTab
