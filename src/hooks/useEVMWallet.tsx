import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi";

export const useEVMWallet = () => {
    const { data: walletClient } = useWalletClient();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const { status, connectors, isPending, connectAsync } = useConnect();

    return {
        walletClient,
        address,
        connectors,
        isPending,
        isConnected,
        status,
        disconnect,
        connectAsync,
    };
};
