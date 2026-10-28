import { http, createConfig } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

const WC_PROJECT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WC_PROJECT_ID) ||
  '2a8295d8236a5f226a494393eacf5230';

const connectors = [];

// 1. WalletConnect Connector (Provides QR Code scanner modal for 300+ wallets)
if (WC_PROJECT_ID) {
  try {
    connectors.push(
      walletConnect({
        projectId: WC_PROJECT_ID,
        showQrModal: true,
        metadata: {
          name: 'ForexNotes',
          description: 'ForexNotes Institutional Trading Journal & Analytics',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://forexnotes.in',
          icons: ['https://forexnotes.in/favicon.ico'],
        },
      })
    );
  } catch (err) {
    console.warn('[Wagmi] WalletConnect connector initialization skipped:', err?.message);
  }
}

// 2. MetaMask Connector
try {
  connectors.push(metaMask());
} catch (err) {
  console.warn('[Wagmi] MetaMask connector initialization skipped:', err?.message);
}

// 3. Generic Injected Connector (Handles Coinbase Wallet, Rabby, Brave, OKX, etc.)
try {
  connectors.push(injected());
} catch (err) {
  console.warn('[Wagmi] Injected connector initialization skipped:', err?.message);
}

export const wagmiConfig = createConfig({
  chains: [bsc],
  connectors,
  transports: {
    [bsc.id]: http(),
  },
});
