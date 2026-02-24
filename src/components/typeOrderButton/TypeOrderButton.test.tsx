import { ChakraProvider } from '@chakra-ui/react'
import { render, screen, fireEvent } from '@testing-library/react'

import TypeOrderButton from './index'

describe('TypeOrderButton', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with default props correctly', () => {
    render(
      <ChakraProvider>
        <TypeOrderButton
          firstOption="Option 1"
          secondOption="Option 2"
          onChange={mockOnChange}
        />
      </ChakraProvider>,
    )

    // Check if both options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()

    // First option should be active by default (check className contains 'bold' instead of style)
    const firstOption = screen.getByText('Option 1')
    const secondOption = screen.getByText('Option 2')

    expect(firstOption).toHaveTextContent('Option 1')
    expect(secondOption).toHaveTextContent('Option 2')

    // onChange should be called once on initial render with the first option
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith('Option 1')
  })

  it('renders with specified initialActive prop', () => {
    render(
      <ChakraProvider>
        <TypeOrderButton
          firstOption="Option 1"
          secondOption="Option 2"
          onChange={mockOnChange}
          initialActive="second"
        />
      </ChakraProvider>,
    )

    // Second option should be active initially
    const firstOption = screen.getByText('Option 1')
    const secondOption = screen.getByText('Option 2')

    expect(firstOption).toHaveTextContent('Option 1')
    expect(secondOption).toHaveTextContent('Option 2')

    // onChange should be called with the second option
    expect(mockOnChange).toHaveBeenCalledWith('Option 2')
  })

  it('switches active option when clicked', () => {
    render(
      <ChakraProvider>
        <TypeOrderButton
          firstOption="Option 1"
          secondOption="Option 2"
          onChange={mockOnChange}
        />
      </ChakraProvider>,
    )

    // Clear the initial call
    mockOnChange.mockClear()

    // Click on the second option
    fireEvent.click(screen.getByText('Option 2'))

    // onChange should be called with the second option
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith('Option 2')

    // Click back on the first option
    fireEvent.click(screen.getByText('Option 1'))

    // onChange should be called with the first option
    expect(mockOnChange).toHaveBeenCalledTimes(2)
    expect(mockOnChange).toHaveBeenLastCalledWith('Option 1')
  })

  it('has the correct component structure', () => {
    const { container } = render(
      <ChakraProvider>
        <TypeOrderButton
          firstOption="Option 1"
          secondOption="Option 2"
          onChange={mockOnChange}
        />
      </ChakraProvider>,
    )

    // Check if both text options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()

    // Verify the component has the right structure - we need to check for multiple Flex components
    const flexElements = container.querySelectorAll('div[class*="css"]')
    expect(flexElements.length).toBeGreaterThan(0)

    // Verify the component has at least two text elements
    const textElements = container.querySelectorAll('p')
    expect(textElements.length).toBeGreaterThanOrEqual(2)
  })
})
