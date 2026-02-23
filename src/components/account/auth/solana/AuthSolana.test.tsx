import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { siwsAuthenticate } from '../../../../utils/authUtils'

import SolanaComponent from './index'

// Mock CSS imports
jest.mock('@solana/wallet-adapter-react-ui/styles.css', () => ({}), {
  virtual: true,
})

// Mock all external dependencies
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}))

jest.mock('@solana/wallet-adapter-react-ui', () => ({
  WalletMultiButton: () => <div data-testid="wallet-button">Wallet Button</div>,
}))

jest.mock('@solana/web3.js', () => ({
  PublicKey: jest.fn(),
}))

jest.mock('ic-siws-js/react', () => ({
  useSiws: jest.fn(),
}))

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => jest.fn()),
}))

jest.mock('../../../../utils/authUtils', () => ({
  siwsAuthenticate: jest.fn(),
}))

// Mock functions
const mockUseWallet = jest.fn()
const mockUseSiws = jest.fn()
const mockDispatch = jest.fn()

// Assign the mocks
jest.requireMock('@solana/wallet-adapter-react').useWallet = mockUseWallet
jest.requireMock('ic-siws-js/react').useSiws = mockUseSiws
jest.requireMock('react-redux').useDispatch.mockReturnValue(mockDispatch)

describe('SolanaComponent', () => {
  const mockOnClose = jest.fn()
  const mockOnAccordionChange = jest.fn()
  const mockLogin = jest.fn()
  const mockPublicKey = {
    toString: jest.fn().mockReturnValue('11111111111111111111111111111111'),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock returns
    mockUseWallet.mockReturnValue({
      wallet: null,
      publicKey: null,
    })

    mockUseSiws.mockReturnValue({
      login: mockLogin,
      loginStatus: 'idle',
      identity: null,
    })

    jest
      .requireMock('../../../../utils/authUtils')
      .siwsAuthenticate.mockResolvedValue(undefined)

    // Mock document.querySelectorAll para os testes que usam
    document.querySelectorAll = jest.fn().mockReturnValue([
      {
        dispatchEvent: jest.fn(),
      },
    ])
  })

  const renderComponent = (props = {}) => {
    return render(
      <ChakraProvider>
        <SolanaComponent
          onClose={mockOnClose}
          currentIndex={null}
          onAccordionChange={mockOnAccordionChange}
          {...props}
        />
      </ChakraProvider>,
    )
  }

  it('renders the accordion with Solana Wallet label', () => {
    renderComponent()
    expect(screen.getByText('Solana Wallet')).toBeInTheDocument()
  })

  it('shows connect wallet button when not connected', () => {
    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })

  it('handles opening wallet modal when connect button is clicked', () => {
    // Mock document.querySelectorAll and event dispatching
    const mockDispatchEvent = jest.fn()
    const mockButton = { dispatchEvent: mockDispatchEvent }
    document.querySelectorAll = jest.fn().mockReturnValue([mockButton])

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))
    // Click connect button
    fireEvent.click(screen.getByText('Connect Wallet'))

    expect(document.querySelectorAll).toHaveBeenCalledWith(
      '.wallet-adapter-button-trigger',
    )
    expect(mockDispatchEvent).toHaveBeenCalled()
  })

  it('shows wallet address and SIWS button when connected', () => {
    mockUseWallet.mockReturnValue({
      wallet: { adapter: { name: 'Mock Wallet' } },
      publicKey: mockPublicKey,
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))

    expect(screen.getByText(/Wallet connected:/)).toBeInTheDocument()
    expect(screen.getByText('Sign In With Solana')).toBeInTheDocument()
  })

  it('calls login function when SIWS button is clicked', async () => {
    mockUseWallet.mockReturnValue({
      wallet: { adapter: { name: 'Mock Wallet' } },
      publicKey: mockPublicKey,
    })

    renderComponent()
    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))
    // Click SIWS button
    fireEvent.click(screen.getByText('Sign In With Solana'))

    expect(mockLogin).toHaveBeenCalled()
  })

  it('calls onClose after successful login with identity', async () => {
    const mockIdentity = { publicKey: '111111111111111111111111111111' }
    mockUseWallet.mockReturnValue({
      wallet: { adapter: { name: 'Mock Wallet' } },
      publicKey: mockPublicKey,
    })

    mockUseSiws.mockReturnValue({
      login: mockLogin,
      loginStatus: 'idle',
      identity: mockIdentity,
    })

    renderComponent()

    await waitFor(() => {
      expect(siwsAuthenticate).toHaveBeenCalledWith(mockDispatch, mockIdentity)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('shows loading state during login', () => {
    mockUseWallet.mockReturnValue({
      wallet: { adapter: { name: 'Mock Wallet' } },
      publicKey: mockPublicKey,
    })

    mockUseSiws.mockReturnValue({
      login: mockLogin,
      loginStatus: 'logging-in',
      identity: null,
    })

    // Render with current index matching expected
    renderComponent({
      currentIndex: 3,
    })

    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))

    // Check if it shows the appropriate text when in the loading state
    expect(screen.getByText('Sign In With Solana')).toBeInTheDocument()
  })

  it('handles when login function is not available', () => {
    mockUseWallet.mockReturnValue({
      wallet: { adapter: { name: 'Mock Wallet' } },
      publicKey: mockPublicKey,
    })

    mockUseSiws.mockReturnValue({
      login: null,
      loginStatus: 'idle',
      identity: null,
    })

    // Render with current index matching expected
    renderComponent({
      currentIndex: 3,
    })

    // Expand the accordion
    fireEvent.click(screen.getByText('Solana Wallet'))

    // Check if the button still appears even when the function is not available
    expect(screen.getByText('Sign In With Solana')).toBeInTheDocument()
  })
})
