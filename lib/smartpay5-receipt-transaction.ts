import { decodeEventLog, toEventSelector, type Hex } from "viem";

export type SmartPay5ReceiptLog = { address?: string; topics?: string[]; data?: string };
const TRANSACTION_RECORDED_TOPIC = toEventSelector("TransactionRecorded(bytes32,uint64,address,string,string,string,string,address,uint256,address,uint256)");
const TRANSACTION_RECORDED_EVENT = [{ type: "event", name: "TransactionRecorded", anonymous: false, inputs: [
  { indexed: true, name: "transactionId", type: "bytes32" }, { indexed: false, name: "timestamp", type: "uint64" },
  { indexed: true, name: "wallet", type: "address" }, { indexed: false, name: "payerId", type: "string" },
  { indexed: false, name: "refId", type: "string" }, { indexed: false, name: "mainId", type: "string" },
  { indexed: false, name: "secondId", type: "string" }, { indexed: true, name: "primaryTokenAddress", type: "address" },
  { indexed: false, name: "primaryTokenAmount", type: "uint256" }, { indexed: false, name: "secondaryTokenAddress", type: "address" },
  { indexed: false, name: "secondaryTokenAmount", type: "uint256" },
] }] as const;

export function smartPay5TransactionIdFromReceipt(
  logs: SmartPay5ReceiptLog[],
  contractAddress: string,
): Hex | null {
  const contract = contractAddress.toLowerCase();
  const matches = logs.filter(log => log.address?.toLowerCase() === contract
    && log.topics?.[0]?.toLowerCase() === TRANSACTION_RECORDED_TOPIC.toLowerCase());
  if (matches.length !== 1 || !matches[0].data || !matches[0].topics) return null;
  try {
    const decoded = decodeEventLog({
      abi: TRANSACTION_RECORDED_EVENT,
      eventName: "TransactionRecorded",
      data: matches[0].data as Hex,
      topics: matches[0].topics as [Hex, ...Hex[]],
      strict: true,
    });
    return decoded.args.transactionId;
  } catch {
    return null;
  }
}
