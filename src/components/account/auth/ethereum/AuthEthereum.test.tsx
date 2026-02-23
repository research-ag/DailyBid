import { ChakraProvider } from '@chakra-ui/react'
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSiwe } from 'ic-siwe-js/react'
import { useDispatch } from 'react-redux'
import { useAccount } from 'wagmi'

import { siweAuthenticate } from '../../../../utils/authUtils'

import EthereumComponent from './index'

// Mock all external dependencies
jest.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: jest.fn(),
  useAccountModal: jest.fn(),
}))

jest.mock('ic-siwe-js/react', () => ({
  useSiwe: jest.fn(),
}))

jest.mock('wagmi', () => ({
  useAccount: jest.fn(),
}))

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}))

jest.mock('../../../../utils/authUtils', () => ({
  siweAuthenticate: jest.fn(),
}))

describe('EthereumComponent', () => {
  const mockOnClose = jest.fn()
  const mockOnAccordionChange = jest.fn()
  const mockDispatch = jest.fn()
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock returns
    ;(useConnectModal as jest.Mock).mockReturnValue({
      openConnectModal: jest.fn(),
      connectModalOpen: false,
    })
    ;(useAccountModal as jest.Mock).mockReturnValue({
      openAccountModal: jest.fn(),
    })
    ;(useSiwe as jest.Mock).mockReturnValue({
      login: mockLogin,
      isInitializing: false,
    })
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: false,
      address: undefined,
    })
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    ;(siweAuthenticate as jest.Mock).mockResolvedValue(undefined)
  })

  const renderComponent = (props = {}) => {
    return render(
      <ChakraProvider>
        <EthereumComponent
          onClose={mockOnClose}
          currentIndex={null}
          onAccordionChange={mockOnAccordionChange}
          {...props}
        />
      </ChakraProvider>,
    )
  }

  it('renders the accordion with Ethereum Wallet label', () => {
    renderComponent()
    expect(screen.getByText('Ethereum Wallet')).toBeInTheDocument()
  })

  it('shows connect wallet button when not connected', () => {
    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('calls openConnectModal when connect button is clicked', () => {
    const mockOpenConnectModal = jest.fn()
    ;(useConnectModal as jest.Mock).mockReturnValue({
      openConnectModal: mockOpenConnectModal,
      connectModalOpen: false,
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))
    // Click connect button
    fireEvent.click(screen.getByText('Connect Wallet'))

    expect(mockOpenConnectModal).toHaveBeenCalled()
  })

  it('shows wallet address and SIWE button when connected', () => {
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))

    expect(screen.getByText(/Wallet connected:/)).toBeInTheDocument()
    // Use regex instead of exact text to be more flexible
    expect(screen.getByText(/0x1234.*5678/)).toBeInTheDocument()
    expect(screen.getByText('Sign In With Ethereum')).toBeInTheDocument()
  })

  it('calls login function when SIWE button is clicked', async () => {
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))
    // Click SIWE button
    fireEvent.click(screen.getByText('Sign In With Ethereum'))

    await waitFor(() => {
      expect(siweAuthenticate).toHaveBeenCalledWith(mockDispatch, mockLogin)
    })
  })

  it('calls onClose after successful login', async () => {
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))
    // Click SIWE button
    fireEvent.click(screen.getByText('Sign In With Ethereum'))

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles login error properly', async () => {
    // Temporarily mock console.error to avoid polluting test output
    const originalConsoleError = console.error
    console.error = jest.fn()
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    ;(siweAuthenticate as jest.Mock).mockRejectedValue(
      new Error('Login failed'),
    )

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Ethereum Wallet'))
    // Click SIWE button
    fireEvent.click(screen.getByText('Sign In With Ethereum'))

    await waitFor(() => {
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    // Restore original console.error implementation
    console.error = originalConsoleError
  })

  it('disables login button when SIWE is initializing', () => {
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    ;(useSiwe as jest.Mock).mockReturnValue({
      login: mockLogin,
      isInitializing: true,
    })

    // Render with currentIndex set to force accordion open
    render(
      <ChakraProvider>
        <EthereumComponent
          onClose={mockOnClose}
          currentIndex={2}
          onAccordionChange={mockOnAccordionChange}
        />
      </ChakraProvider>,
    )

    // Now we can find the button
    const loginButton = screen.getByText('Sign In With Ethereum')
    expect(loginButton.closest('button')).toBeDisabled()
  })

  it('disables login button when login function is not available', () => {
    ;(useAccount as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890abcdef1234567890abcdef12345678',
    })
    ;(useSiwe as jest.Mock).mockReturnValue({
      login: null,
      isInitializing: false,
    })

    // Render with currentIndex set to force accordion open
    render(
      <ChakraProvider>
        <EthereumComponent
          onClose={mockOnClose}
          currentIndex={2}
          onAccordionChange={mockOnAccordionChange}
        />
      </ChakraProvider>,
    )

    // Now we can find the button
    const loginButton = screen.getByText('Sign In With Ethereum')
    expect(loginButton.closest('button')).toBeDisabled()
  })
})
