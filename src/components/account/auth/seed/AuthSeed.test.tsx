import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureStore from 'redux-mock-store'

import { seedAuthenticate } from '../../../../utils/authUtils'

import SeedComponent from './'

jest.mock('../../../../utils/authUtils', () => ({
  seedAuthenticate: jest.fn(),
}))

const mockStore = configureStore([])

describe('SeedComponent', () => {
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
        <SeedComponent
          onClose={onCloseMock}
          onAccordionChange={onAccordionChangeMock}
        />
      </Provider>,
    )
  }

  it('renders the component correctly', () => {
    renderComponent()
    expect(screen.getByText('Seed (developers only)')).toBeInTheDocument()
  })

  it('calls onAccordionChange when the accordion is toggled', () => {
    renderComponent()
    const accordionButton = screen.getByText('Seed (developers only)')
    fireEvent.click(accordionButton)

    expect(onAccordionChangeMock).toHaveBeenCalledWith(2)
  })

  it('authenticates with the seed when Enter is pressed', async () => {
    renderComponent()

    const accordionButton = screen.getByText('Seed (developers only)')
    fireEvent.click(accordionButton)

    const input = await screen.findByLabelText('Enter your seed')
    fireEvent.change(input, { target: { value: 'test-seed-value' } })

    expect(input).toHaveValue('test-seed-value')

    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(seedAuthenticate).toHaveBeenCalledWith(
        'test-seed-value',
        expect.any(Function),
      )
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('renders the input field and handles state correctly', async () => {
    renderComponent()

    const accordionButton = screen.getByText('Seed (developers only)')
    fireEvent.click(accordionButton)

    const input = await screen.findByLabelText('Enter your seed')
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'test-seed' } })

    expect(input).toHaveValue('test-seed')
  })
})
