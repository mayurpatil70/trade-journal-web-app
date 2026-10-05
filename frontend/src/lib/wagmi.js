import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'

export const wagmiConfig = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})
