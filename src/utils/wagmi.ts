import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient } from '@tanstack/react-query'
import { http, createConfig } from 'wagmi'
import { mainnet, polygon, sepolia } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

// Replace with your own WalletConnect project ID
// Register for free at https://walletconnect.com/
const WALLETCONNECT_PROJECT_ID = '863c4dd091055389bae5f17cc62595e0'

export const chains = [mainnet, polygon, sepolia] as const
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, sepolia],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
    }),
  ],
})

export const queryClient = new QueryClient()
