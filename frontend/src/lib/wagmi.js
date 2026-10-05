import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [bsc.id]: http(),
  },
})
