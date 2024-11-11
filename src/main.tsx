import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { environment, GardenProvider } from '@gardenfi/react-hooks';
import { wagmiConfig } from './config/wagmi.ts';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GardenProvider
          config={{
            store: localStorage,
            environment: environment.testnet,
          }}
        >
          <App />
        </GardenProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
