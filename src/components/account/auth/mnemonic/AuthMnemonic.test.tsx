import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useDispatch } from 'react-redux'

import useWindow from '../../../../hooks/useWindow'
import * as authUtils from '../../../../utils/authUtils'
import * as cryptoUtils from '../../../../utils/cryptoUtils'

import MnemonicComponent from './'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}))

jest.mock('../../../../hooks/useWindow', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getIsTelegramApp: jest.fn(),
  })),
}))

jest.mock('../../../../utils/authUtils', () => ({
  mnemonicAuthenticate: jest.fn(),
}))

jest.mock('../../../../utils/cryptoUtils', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}))

describe('MnemonicComponent', () => {
  const mockOnClose = jest.fn()
  const mockOnAccordionChange = jest.fn()
  const mockDispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useWindow as jest.Mock).mockReturnValue({
      getIsTelegramApp: jest.fn(() => ({
        isTelegram: false,
        isTelegramWeb: false,
      })),
    })
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    ;(authUtils.mnemonicAuthenticate as jest.Mock).mockResolvedValue(true)
    ;(cryptoUtils.encrypt as jest.Mock).mockReturnValue('encryptedMnemonic')
    ;(cryptoUtils.decrypt as jest.Mock).mockReturnValue('decryptedMnemonic')
    localStorage.setItem('mnemonicPhrase', '')
  })

  const renderComponent = () => {
    render(
      <MnemonicComponent
        onClose={mockOnClose}
        onAccordionChange={mockOnAccordionChange}
      />,
    )
  }

  it('renders the component correctly', () => {
    renderComponent()

    expect(screen.getByText('Mnemonic')).toBeInTheDocument()
  })

  it('displays error for invalid mnemonic phrase', async () => {
    renderComponent()

    const accordionButton = screen.getByText('Mnemonic')
    fireEvent.click(accordionButton)

    const input = await screen.findByLabelText(
      'Suggested phrase between 12 and 24 words',
    )

    fireEvent.change(input, { target: { value: 'invalid phrase' } })

    expect(
      screen.getByText('Invalid mnemonic phrase. Please check your input.'),
    ).toBeInTheDocument()
  })

  it('authenticates with valid mnemonic phrase', async () => {
    renderComponent()

    const accordionButton = screen.getByText('Mnemonic')
    fireEvent.click(accordionButton)

    const input = await screen.findByLabelText(
      'Suggested phrase between 12 and 24 words',
    )
    fireEvent.change(input, {
      target: {
        value: 'test test test test test test test test test test test test',
      },
    })

    const button = screen.getByText('Log in')
    expect(button).not.toBeDisabled()
    await waitFor(async () => {
      fireEvent.click(button)
    })

    expect(authUtils.mnemonicAuthenticate).toHaveBeenCalledWith(
      [
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
        'test',
      ],
      mockDispatch,
    )

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('uses stored mnemonic when in Telegram app', async () => {
    localStorage.setItem('mnemonicPhrase', 'encryptedMnemonic')
    ;(useWindow as jest.Mock).mockReturnValue({
      getIsTelegramApp: jest.fn(() => ({
        isTelegram: true,
        isTelegramWeb: true,
      })),
    })

    renderComponent()

    const accordionButton = screen.getByText('Mnemonic')
    fireEvent.click(accordionButton)

    const buttons = await screen.findAllByText('Use stored Mnemonic')

    expect(buttons.length).toBeGreaterThan(0)

    expect(buttons[0]).toBeInTheDocument()
  })

  it('generates new mnemonic if no stored mnemonic exists and in Telegram app', async () => {
    ;(useWindow as jest.Mock).mockReturnValue({
      getIsTelegramApp: jest.fn(() => ({
        isTelegram: true,
        isTelegramWeb: true,
      })),
    })

    renderComponent()

    const button = screen.getByText('Generate new Mnemonic')
    await waitFor(async () => {
      fireEvent.click(button)
    })

    const input = screen.getByLabelText(
      'Suggested phrase between 12 and 24 words',
    ) as HTMLInputElement

    await waitFor(() => {
      expect(input.value).toMatch(/\w+/)
    })
  })
})
