const explorers: Record<number, string> = {
  1: "https://etherscan.io",
  56: "https://bscscan.com",
  137: "https://polygonscan.com",
  8453: "https://basescan.org"
};

export function explorerUrl(chainId: number, kind: "address" | "token" | "tx", value: string) {
  const base = explorers[chainId];
  const valid = kind === "tx" ? /^0x[a-fA-F0-9]{64}$/.test(value) : /^0x[a-fA-F0-9]{40}$/.test(value);
  return base && valid ? `${base}/${kind}/${value}` : null;
}

export function explorerChainId(chainName: string) {
  const normalized = chainName.toLowerCase();
  if (normalized.includes("ethereum")) return 1;
  if (normalized.includes("bnb") || normalized.includes("bsc")) return 56;
  if (normalized.includes("polygon")) return 137;
  if (normalized.includes("base")) return 8453;
  return null;
}
