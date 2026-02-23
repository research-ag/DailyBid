import { Buffer } from 'buffer'

import { ChakraProvider, useColorMode, useTheme } from '@chakra-ui/react'
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { QueryClientProvider } from '@tanstack/react-query'
import { SiweIdentityProvider } from 'ic-siwe-js/react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'

import App from './app'
import SiwsProvider from './providers/SolanaSignIn/siws-provider'
import SolanaProviders from './providers/SolanaSignIn/solana-providers'
import store from './store'
import theme from './theme'
import { canisterId } from '../declarations/ic_siwe_provider'
import { wagmiConfig, queryClient } from './utils/wagmi'

// Ensure Buffer is available globally
if (!window.Buffer) window.Buffer = Buffer

const container = document.getElementById('root')
const root = createRoot(container!)

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <SolanaProviders>
              <SiwsProvider>
                <RainbowKitThemeWrapper />
              </SiwsProvider>
            </SolanaProviders>
          </QueryClientProvider>
        </WagmiProvider>
      </ChakraProvider>
    </Provider>
  </BrowserRouter>,
)

// RainbowKit wrapper component to access Chakra theme
function RainbowKitThemeWrapper() {
  const { colorMode } = useColorMode()
  const chakraTheme = useTheme()

  // Get accent color from Chakra's blue or purple colors
  const accentColor = chakraTheme.colors.blue[500]

  return (
    <RainbowKitProvider
      modalSize="compact"
      theme={
        colorMode === 'dark'
          ? darkTheme({
              accentColor: accentColor,
              accentColorForeground: 'white',
              borderRadius: 'large',
              overlayBlur: 'small',
            })
          : lightTheme({
              accentColor: accentColor,
              accentColorForeground: 'white',
              borderRadius: 'large',
              overlayBlur: 'small',
            })
      }
    >
      <SiweIdentityProvider canisterId={canisterId}>
        <App />
      </SiweIdentityProvider>
    </RainbowKitProvider>
  )
}
