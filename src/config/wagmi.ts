import { createConfig, http } from 'wagmi';
import { arbitrum, arbitrumSepolia, mainnet, sepolia } from 'wagmi/chains';
import { injected, metaMask, safe } from 'wagmi/connectors';

const SupportedChains = [
    mainnet,
    arbitrum,
    sepolia,
    arbitrumSepolia,
] as const;

export const wagmiConfig = createConfig({
    chains: SupportedChains,
    connectors: [injected(), metaMask(), safe()],
    multiInjectedProviderDiscovery: true,
    cacheTime: 10_000,
    transports: {
        [mainnet.id]: http(),
        [arbitrum.id]: http(),
        [sepolia.id]: http(),
        [arbitrumSepolia.id]: http(),
    },
});