import { ParseOrderStatus } from "@gardenfi/core";
import { Chain, MatchedOrder } from "@gardenfi/orderbook";

const GARDEN_TESTNET_CONFIG = {
    DATA_URL: "https://prod-mainnet-virtual-balance-pr-5.onrender.com",
    ORDERBOOK_URL: "https://evm-swapper-relay.onrender.com",
    QUOTE_URL: "https://quote-knrp.onrender.com",
} as const;

const GARDEN_MAINNET_CONFIG = {
    DATA_URL: "https://dummy.fi",
    ORDERBOOK_URL: "https://dummy.fi",
    QUOTE_URL: "https://dummy.fi",
} as const;

const isTestnet = true;

const GARDEN_CONFIG = isTestnet ? GARDEN_TESTNET_CONFIG : GARDEN_MAINNET_CONFIG;

export const API = () => {
    Object.entries(GARDEN_CONFIG).forEach(([key, value]) => {
        if (!value) throw new Error(`Missing ${key} in env`);
    });

    return {
        home: "https://garden.finance",
        data: {
            data: GARDEN_CONFIG.DATA_URL,
            assets: GARDEN_CONFIG.DATA_URL + "/assets",
            blockNumbers: (network: "mainnet" | "testnet") =>
                GARDEN_CONFIG.DATA_URL + "/blocknumber/" + network,
        },
        orderbook: GARDEN_CONFIG.ORDERBOOK_URL,
        quote: GARDEN_CONFIG.QUOTE_URL,
        mempool: {
            testnet: "https://mempool.space/testnet4/api",
            mainnet: "https://mempool.space/api",
        },
    };
};

export const parseStatus = (order: MatchedOrder, blockNumbers: Record<Chain, number> | null) => {

    if (!blockNumbers) return;
    const { source_swap, destination_swap } = order;
    const sourceBlockNumber = blockNumbers[source_swap.chain];
    const destinationBlockNumber = blockNumbers[destination_swap.chain];
    if (!sourceBlockNumber || !destinationBlockNumber) return;

    return ParseOrderStatus(order, sourceBlockNumber, destinationBlockNumber);
};