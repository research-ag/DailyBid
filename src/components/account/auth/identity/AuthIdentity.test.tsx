import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { identityAuthenticate } from '../../../../utils/authUtils'

import IdentityComponent from './'

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

  const renderComponent = (currentIndex: number | null = null) => {
    render(
      <Provider store={store}>
        <IdentityComponent
          onClose={onCloseMock}
          label={'Internet Identity'}
          ownIndex={0}
          currentIndex={currentIndex}
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
    expect(onAccordionChangeMock).toHaveBeenCalledWith(0)
  })

  it('calls identityAuthenticate and onClose when Log in button is clicked', async () => {
    renderComponent(0)
    const accordionButton = screen.getByText('Internet Identity')
    fireEvent.click(accordionButton)

    await waitFor(() => {
      const logInButton = screen.getByRole('button', { name: /log in/i })
      fireEvent.click(logInButton)

      expect(identityAuthenticate).toHaveBeenCalledWith(
        expect.any(Function),
        'IC',
      )
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('renders the Log in button and handles its state correctly', async () => {
    renderComponent(0)
    const accordionButton = screen.getByText('Internet Identity')
    fireEvent.click(accordionButton)

    await waitFor(() => {
      const panel = screen.getByRole('region', { name: /internet identity/i })
      expect(panel).toBeVisible()
    })

    const logInButton = screen.getByRole('button', { name: 'Log in' })
    expect(logInButton).toBeInTheDocument()
    expect(logInButton).not.toBeDisabled()
  })
})
