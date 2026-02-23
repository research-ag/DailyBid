import { useWallet } from '@solana/wallet-adapter-react'
import { SiwsIdentityProvider } from 'ic-siws-js/react'

import { canisterId } from '../../../declarations/ic_siws_provider'

export default function SiwsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Listen for changes to the selected wallet
  const { wallet } = useWallet()

  // Update the SiwsIdentityProvider with the selected wallet adapter
  return (
    <SiwsIdentityProvider canisterId={canisterId} adapter={wallet?.adapter}>
      {children}
    </SiwsIdentityProvider>
  )
}
