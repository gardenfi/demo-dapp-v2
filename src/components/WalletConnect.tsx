import { Connector } from "wagmi";
import { useEVMWallet } from "../hooks/useEVMWallet";
import { WalletClient } from "viem";
import { getWalletClient } from "wagmi/actions";
import { wagmiConfig } from "../config/wagmi";

type MetaMaskButtonProps = {
    isConnected: boolean;
    onClick: () => void;
};

const MetaMaskButton: React.FC<MetaMaskButtonProps> = ({
    isConnected,
    onClick,
}) => {
    const buttonClass = `connect-metamask button-${isConnected ? "black" : "white"
        }`;
    const buttonText = isConnected ? "Connected" : "Connect Metamask";

    return (
        <button className={buttonClass} onClick={onClick}>
            {buttonText}
        </button>
    );
};

export const WalletConnect: React.FC = () => {
    const { connectors, isConnected } = useEVMWallet();

    const handleConnect = async (connectors: readonly Connector[]) => {
        try {
            // Filter connectors to support only MetaMask or injected wallets
            const supportedConnectors = connectors.filter(connector =>
                connector.name === 'MetaMask' || connector.isInjected
            );

            for (const connector of supportedConnectors) {
                await connector.connect();
                const walletClient: WalletClient = await getWalletClient(wagmiConfig, {
                    connector: connector,
                });
                if (!walletClient?.account) continue;
            }
        } catch (error) {
            console.warn("error :", error);
        } finally {
            console.log("finally");
        }
    };

    return (
        <div className="swap-component-top-section">
            <span className="swap-title">Swap</span>
            <MetaMaskButton
                isConnected={isConnected}
                onClick={() => handleConnect(connectors)}
            />
        </div>
    );
};