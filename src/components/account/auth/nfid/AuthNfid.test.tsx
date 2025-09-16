import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { identityAuthenticate } from '../../../../utils/authUtils'

import NfidComponent from './'

jest.mock('../../../../utils/authUtils', () => ({
  identityAuthenticate: jest.fn(),
}))

const mockStore = configureStore([])

describe('NfidComponent', () => {
  let store: ReturnType<typeof mockStore>
  let onCloseMock: jest.Mock
  let onAccordionChangeMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    store = mockStore({})
    onCloseMock = jest.fn()
    onAccordionChangeMock = jest.fn()
  })

  const renderComponent = (currentIndex: number | null = null) => {
    render(
      <Provider store={store}>
        <NfidComponent
          onClose={onCloseMock}
          ownIndex={0}
          currentIndex={currentIndex}
          onAccordionChange={onAccordionChangeMock}
        />
      </Provider>,
    )
  }

  it('renders the component correctly', () => {
    renderComponent()
    expect(screen.getByText('NFID')).toBeInTheDocument()
  })

  it('calls onAccordionChange when the accordion is toggled', () => {
    renderComponent()
    const accordionButton = screen.getByText('NFID')
    fireEvent.click(accordionButton)

    expect(onAccordionChangeMock).toHaveBeenCalledWith(1)
  })

  it('calls identityAuthenticate and onClose when Log in button is clicked', async () => {
    renderComponent(1)

    const accordionButton = screen.getByText('NFID')
    fireEvent.click(accordionButton)

    const logInButton = await screen.findByText('Log in')
    fireEvent.click(logInButton)

    await waitFor(() => {
      expect(identityAuthenticate).toHaveBeenCalledWith(
        expect.any(Function),
        'NFID',
      )
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('renders the Log in button and handles its state correctly', () => {
    renderComponent(1)

    const accordionButton = screen.getByText('NFID')
    fireEvent.click(accordionButton)

    const logInButton = screen.getByText('Log in')
    expect(logInButton).toBeInTheDocument()
    expect(logInButton).not.toBeDisabled()
  })
})
