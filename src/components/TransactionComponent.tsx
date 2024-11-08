import { useCallback, useEffect, useState } from "react";
import { formatUnits } from "ethers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { faUpRightAndDownLeftFromCenter } from "@fortawesome/free-solid-svg-icons";
import { Chain, MatchedOrder } from "@gardenfi/orderbook";
import { OrderStatus } from "@gardenfi/core";
import { useGarden } from "@gardenfi/react-hooks";
import { API, parseStatus } from "../helpers/utils";

function TransactionsComponent() {
  const { garden, orderBook } = useGarden();
  const [orders, setOrders] = useState<MatchedOrder[]>([]);
  const [blockNumbers, setBlockNumbers] = useState<Record<Chain, number> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!orderBook) return;
    const res = await orderBook.fetchOrders(true, false, {
      per_page: 4,
    });
    setOrders(res.val.data);
  }, [orderBook]);

  useEffect(() => {
    fetchOrders(); // Initial fetch

    const intervalId = setInterval(fetchOrders, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [fetchOrders]);

  useEffect(() => {
    if (!orderBook) return;
    const fetchBlockNumbers = async () => {
      const res = await axios.get<{
        [key in Chain]: number;
      }>(API().data.blockNumbers("testnet"));

      setBlockNumbers(res.data);
    };

    fetchBlockNumbers();
  }, [garden, orderBook]);

  return (
    <div className="transaction-component">
      {orders.map((order) => (
        <OrderComponent order={order} status={parseStatus(order, blockNumbers)} key={order.created_at} />
      ))}
    </div>
  );
}

type Order = {
  order: MatchedOrder;
  status?: OrderStatus;
};

const OrderComponent: React.FC<Order> = ({ order, status }) => {
  const [modelIsVisible, setModelIsVisible] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);

  const { evmInitiate } = useGarden();

  const handleInitiate = async () => {
    if (!evmInitiate) return;
    setIsInitiating(true);
    const res = await evmInitiate(order);
    if (res.ok) {
      console.log("Initiated");
      status = OrderStatus.InitiateDetected;
    } else {
      alert("Failed to initiate");
    }
    setIsInitiating(false);
  };
  
  const {
    source_swap,
    destination_swap,
  } = order;
  
  const wbtcAmount = formatUnits(source_swap.amount, 8);
  const btcAmount = formatUnits(destination_swap.amount, 8);
  
  const userFriendlyStatus = status && getUserFriendlyStatus(status);
  
  const toggleModelVisible = () => setModelIsVisible((pre) => !pre);

  const txFromBtcToWBTC =
    order.source_swap.asset.toLowerCase() === "btc";

  const fromLabel = txFromBtcToWBTC ? "BTC" : "WBTC";
  const toLabel = txFromBtcToWBTC ? "WBTC" : "BTC";

  return (
    <div className="order">
      <div className="order-id">
        <div>
          Order Id <span>{source_swap.swap_id.slice(0,4)}...</span>
        </div>
        <span className="enlarge">
          <FontAwesomeIcon
            icon={faUpRightAndDownLeftFromCenter}
            style={{ color: "#ffffff" }}
            onClick={toggleModelVisible}
          />
        </span>
      </div>
      <div className="amount-and-status">
        <div className="amount-label">{fromLabel}</div>
        <div className="amount-label">{toLabel}</div>
        <div className="status-label">Status</div>
        <div className="amount">{wbtcAmount}</div>
        <div className="amount">{btcAmount}</div>
        {  userFriendlyStatus === StatusLabel.Initiate ? (
          <button
            className={`button-${isInitiating ? "black" : "white"}`}
            disabled={isInitiating}
            onClick={handleInitiate}
          >
            {isInitiating ? "Initiating..." : "Initiate"}
          </button>
        ) : (
          <div className="status">
            <span>{userFriendlyStatus}</span>
          </div>
        )}
      </div>
      {modelIsVisible && (
        <OrderPopUp
          order={order}
          toggleModelVisible={toggleModelVisible}
          fromLabel={fromLabel}
          toLabel={toLabel}
        />
      )}
    </div>
  );
};

enum StatusLabel {
  Completed = "Completed",
  Pending = "In progress...",
  Expired = "Expired",
  Initiate = "Awaiting initiate",
}

const getUserFriendlyStatus = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Redeemed:
    case OrderStatus.Refunded:
    case OrderStatus.CounterPartyRedeemed:
    case OrderStatus.CounterPartyRedeemDetected:
      return StatusLabel.Completed;
    case OrderStatus.Matched:
      return StatusLabel.Initiate;
    case OrderStatus.DeadLineExceeded:
      return StatusLabel.Expired;
    default:
      return StatusLabel.Pending;
  }
};

function getFormattedDate(CreatedAt: string): string {
  const date = new Date(CreatedAt);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const formattedTime = date
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", " : ");

  return `${formattedDate} | ${formattedTime}`;
}

type PopUp = {
  order: MatchedOrder;
  toggleModelVisible: () => void;
  fromLabel: string;
  toLabel: string;
};

const OrderPopUp: React.FC<PopUp> = ({
  order,
  toggleModelVisible,
  fromLabel,
  toLabel,
}) => {
  const {
    destination_swap: { redeemer: to, amount: toAmount, redeem_tx_hash, },
    created_at,
    source_swap: {
      initiator: from,
      amount: fromAmount,
      initiate_tx_hash,
      refund_tx_hash,
      swap_id,
    },
  } = order;

  const formattedDate = getFormattedDate(created_at);

  return (
    <div className="pop-up-container" onClick={toggleModelVisible}>
      <div className="pop-up" onClick={(e) => e.stopPropagation()}>
        <span>
          <span className="pop-up-label">Created At</span>
          <span className="pop-up-value">{formattedDate}</span>
        </span>
        <span>
          <span className="pop-up-label">Order Id</span>
          <span className="pop-up-value">{swap_id}</span>
        </span>
        <span>
          <span className="pop-up-label">From</span>
          <span className="pop-up-value">{from}</span>
        </span>
        <span>
          <span className="pop-up-label">To</span>
          <span className="pop-up-value">{to}</span>
        </span>
        <span>
          <span className="pop-up-label">{fromLabel}</span>
          <span className="pop-up-value">{Number(fromAmount) / 1e8}</span>
        </span>
        <span>
          <span className="pop-up-label">{toLabel}</span>
          <span className="pop-up-value">{Number(toAmount) / 1e8}</span>
        </span>
        {initiate_tx_hash && (
          <span>
            <span className="pop-up-label">Initiate txHash</span>
            <span className="pop-up-value">{initiate_tx_hash}</span>
          </span>
        )}
        {redeem_tx_hash && (
          <span>
            <span className="pop-up-label">Redeem txHash</span>
            <span className="pop-up-value">{redeem_tx_hash}</span>
          </span>
        )}
        {refund_tx_hash && (
          <span>
            <span className="pop-up-label">Refund txHash</span>
            <span className="pop-up-value">{refund_tx_hash}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default TransactionsComponent;
