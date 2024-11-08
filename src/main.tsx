import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BitcoinNetwork, GardenProvider } from '@gardenfi/react-hooks';
import { wagmiConfig } from './config/wagmi.ts';
import { API } from './helpers/utils.ts';

const queryClient = new QueryClient();
const api = API();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GardenProvider
          config={{
            orderBookUrl: api.orderbook,
            quoteUrl: api.quote,
            store: localStorage,
            network: BitcoinNetwork.Testnet,
            bitcoinRPCUrl: api.mempool.testnet,
            blockNumberFetcherUrl: api.data.data,
          }}
        >
          <App />
        </GardenProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
