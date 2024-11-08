import { useState } from "react";
import { useAccount } from 'wagmi';
import {
  Asset,
  SupportedAssets
} from '@gardenfi/orderbook';
import '../styles/App.css';
import { useGarden } from "@gardenfi/react-hooks";
import { useEVMWallet } from "../hooks/useEVMWallet";
import { WalletConnect } from "./WalletConnect";

type SwapAndAddressComponentProps = {
  swapParams: {
    inputToken: Asset;
    outputToken: Asset;
    inputAmount: number;
    outputAmount: number;
    btcAddress: string;
  },
};

type SwapAmountComponentProps = {
  inAmount: string;
  outAmount: string;
  changeAmount: (value: string) => void;
};

const SwapComponent: React.FC = () => {
  const [swapParams, setSwapParams] = useState({
    inputToken: SupportedAssets.testnet.ethereum_sepolia_0x3c6a17b8cd92976d1d91e491c93c98cd81998265,
    outputToken: SupportedAssets.testnet.bitcoin_testnet_primary,
    inputAmount: 0.1,
    outputAmount: 0.098,
    btcAddress: '',
});

  const handleInputChange = (value: string) => {
    const amount = Number(value);
    //you should ideally get the quote from getQuote method, but for now we are just using a simple formula as the quote is static
    const outputAmount = amount * 0.997;
    setSwapParams({
      ...swapParams,
      inputAmount: amount,
      outputAmount: outputAmount,
    });
  };

  return (
    <div className="swap-component">
      <WalletConnect />
      <hr></hr>
      <SwapAmount inAmount={swapParams.inputAmount.toString()} outAmount={swapParams.outputAmount.toString()} changeAmount={handleInputChange} />
      <hr></hr>
      <Swap swapParams={swapParams} />
    </div>
  );
};

const SwapAmount: React.FC<SwapAmountComponentProps> = ({
  inAmount,
  outAmount,
  changeAmount,
}) => {

  return (
    <div className="swap-component-middle-section">
      <InputField
        id="wbtc"
        label="Send WBTC"
        value={inAmount}
        onChange={(value) => changeAmount(value)}
      />
      <InputField id="btc" label="Receive BTC" value={outAmount} readOnly />
    </div>
  );
};

type InputFieldProps = {
  id: string;
  label: string;
  value: string | null;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  readOnly,
  onChange,
}) => (
  <div>
    <label htmlFor={id}>{label}</label>
    <div className="input-component">
      <input
        id={id}
        placeholder="0"
        value={value ? value : ""}
        type="number"
        readOnly={readOnly}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      <button>{id.toUpperCase()}</button>
    </div>
  </div>
);

const Swap: React.FC<SwapAndAddressComponentProps> = ({
  swapParams,
}) => {
  const { address: EvmAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const { initializeSecretManager, swapAndInitiate , getQuote } = useGarden();
  const [btcAddress, setBtcAddress] = useState<string>();
  const { isConnected } = useEVMWallet();

  const handleSwap = async () => {
    const sendAmount =
      swapParams.inputAmount * 10 ** swapParams.inputToken.decimals;

    if (!initializeSecretManager) return;
    const smRes = await initializeSecretManager();

    if (
      !smRes.ok ||
      !swapAndInitiate ||
      !EvmAddress ||
      !swapParams.inputAmount ||
      !swapParams.outputAmount ||
      !smRes.val.getMasterPrivKey() ||
      !getQuote ||
      !btcAddress
    )
      return;

    setLoading(true);

    const quote = await getQuote({
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      amount: sendAmount
    });

    if (quote.error) {
      alert(quote.error);
      return;
    }

    const [_strategy, quoteAmount] = Object.entries(quote.val.quotes)[0];

    const res = await swapAndInitiate({
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      sendAmount: sendAmount.toString(),
      receiveAmount: quoteAmount.toString(),
      additionalData: {
        btcAddress,
        strategyId: _strategy,
      },
    });

    setLoading(false);

    if (res.error) {
      alert(res.error);
      return
    }

    console.log(res.ok);
    console.log(res.val);
  };

  return (
    <div className="swap-component-bottom-section">
      <div>
        <label htmlFor="receive-address">Receive address</label>
        <div className="input-component">
          <input
            id="receive-address"
            placeholder="Enter BTC Address"
            value={btcAddress ? btcAddress : ""}
            onChange={(e) => setBtcAddress(e.target.value)}
          />
        </div>
      </div>
      <button
        className={`button-${!isConnected || loading ? "black" : "white"}`}
        onClick={handleSwap}
        disabled={!isConnected || loading}
      >
        {loading ? "Processing..."  : "Swap"}
      </button>
    </div>
  );
};

export default SwapComponent;
