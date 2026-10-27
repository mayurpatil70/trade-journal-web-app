import { http, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Only enable WalletConnect if a real project ID is provided in env
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;

const connectors = [
  injected(),
  metaMask(),
];

if (WC_PROJECT_ID && WC_PROJECT_ID !== '3fcc6bba6f1de962d911bb5b5c3dba68') {
  try {
    connectors.push(
      walletConnect({
        projectId: WC_PROJECT_ID,
        showQrModal: true,
      })
    );
  } catch (err) {
    console.warn('[Wagmi] WalletConnect skipped:', err?.message);
  }
}

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors,
  transports: {
    [bsc.id]: http(),
  },
});
