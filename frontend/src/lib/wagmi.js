import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Fallback public projectId for testing if env is missing
const PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID || '3fcc6bba6f1de962d911bb5b5c3dba68';

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId: PROJECT_ID,
      showQrModal: true 
    }),
  ],
  transports: {
    [bsc.id]: http(),
  },
})
