import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import CanisterIdSettings from './canisterIdSettings'

const mockStore = configureStore()
const initialState = {
  auth: {
    userAgent: {},
  },
  orders: {},
  prices: {},
  tokens: {},
}
const store = mockStore(initialState)

jest.mock('@research-ag/ckbtc-address-js', () => ({
  Minter: jest.fn(),
  CKBTC_MINTER_MAINNET_XPUBKEY: 'mock-xpubkey',
}))

jest.mock('../../../utils/authUtils', () => ({
  getAgent: jest.fn(() => ({
    fetchRootKey: jest.fn(),
    getPrincipal: jest.fn().mockResolvedValue('mock-principal'),
  })),
}))

jest.mock('@icp-sdk/core/agent', () => ({
  HttpAgent: jest.fn().mockImplementation(() => ({
    createSync: jest.fn(),
    fetchRootKey: jest.fn(),
    getPrincipal: jest.fn().mockResolvedValue('mock-principal'),
  })),
  AnonymousIdentity: jest.fn(),
}))

jest.mock('../../../hooks/useTokens', () => () => ({
  getTokens: jest.fn(),
}))

jest.mock('../../../utils/canisterUtils', () => ({
  getAuctionCanisterId: jest.fn(() => 'mock-canister-id'),
}))

describe('CanisterIdSettings Component', () => {
  const renderComponent = () => {
    render(
      <Provider store={store}>
        <ChakraProvider>
          <CanisterIdSettings />
        </ChakraProvider>
      </Provider>,
    )
  }

  it('renders the component with default values', async () => {
    renderComponent()

    await waitFor(() => {
      const inputElement = screen.getByLabelText('Backend Canister Id')
      expect(inputElement).toBeInTheDocument()
      expect(inputElement).toHaveValue('mock-canister-id')

      const saveButton = screen.getByText('Save')
      expect(saveButton).toBeInTheDocument()
    })
  })

  it('shows an error for invalid Canister ID', async () => {
    renderComponent()

    await waitFor(() => {
      const inputElement = screen.getByLabelText('Backend Canister Id')
      fireEvent.change(inputElement, { target: { value: 'invalid-id' } })

      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)

      const errorMessage = screen.getByText('Invalid Canister ID')
      expect(errorMessage).toBeInTheDocument()
    })
  })

  it('updates the input field value', async () => {
    renderComponent()

    await waitFor(() => {
      const inputElement = screen.getByLabelText('Backend Canister Id')
      fireEvent.change(inputElement, {
        target: { value: 'g2mgr-byaaa-aaaai-aaaaa-cai' },
      })

      expect(inputElement).toHaveValue('g2mgr-byaaa-aaaai-aaaaa-cai')
    })
  })
})
