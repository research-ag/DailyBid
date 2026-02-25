import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { identityAuthenticate } from '../../../../utils/authUtils'

import IdentityComponent from './'

jest.mock('../../../../hooks/useWindow', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getIsTelegramApp: jest.fn(() => ({
      isTelegram: false,
      isTelegramWeb: false,
    })),
  })),
}))

jest.mock('../../../../utils/deviceUtils', () => ({
  getDeviceType: jest.fn(() => 'desktop'),
  customPopup: jest.fn(async (fn: any) => await fn()),
}))

jest.mock('../../../../utils/authUtils', () => ({
  identityAuthenticate: jest.fn(),
}))

const mockStore = configureStore([])

describe('IdentityComponent', () => {
  let store: ReturnType<typeof mockStore>
  let onCloseMock: jest.Mock
  let onAccordionChangeMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    store = mockStore({})
    onCloseMock = jest.fn()
    onAccordionChangeMock = jest.fn()
  })

  const renderComponent = () => {
    render(
      <Provider store={store}>
        <IdentityComponent
          onClose={onCloseMock}
          label={'Internet Identity'}
          onAccordionChange={onAccordionChangeMock}
        />
      </Provider>,
    )
  }

  it('renders the component correctly', () => {
    renderComponent()
    expect(screen.getByText('Internet Identity')).toBeInTheDocument()
  })

  it('calls onAccordionChange when the accordion is toggled', () => {
    renderComponent()
    const accordionButton = screen.getByText('Internet Identity')
    fireEvent.click(accordionButton)
    expect(onAccordionChangeMock).toHaveBeenCalled()
  })

  it('calls identityAuthenticate and onClose when Log in button is clicked', async () => {
    renderComponent()
    const accordionButton = screen.getByText('Internet Identity')
    fireEvent.click(accordionButton)

    await waitFor(() => {
      const logInButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(logInButton)

      expect(identityAuthenticate).toHaveBeenCalledWith(
        expect.any(Function),
        'IC',
        undefined,
      )
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('renders the Log in button and handles its state correctly', async () => {
    renderComponent()
    const accordionButton = screen.getByText('Internet Identity')
    fireEvent.click(accordionButton)

    const logInButton = await screen.findByRole('button', { name: 'Log in' })
    expect(logInButton).toBeInTheDocument()
    expect(logInButton).not.toBeDisabled()
  })
})
