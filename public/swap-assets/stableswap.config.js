window.GREATLOVE_STABLESWAP_CONFIG = {
  walletMethods: {
    walletconnect: {
      enabled: true,
      projectId: '0d850a98123d379c16d0d9f2555d39bb',
      version: 2,
      requiredChains: [137],
      dappUrl: 'https://greatlovemeta.com'
    },
    importWallet: {
      enabled: false
    }
  },
  walletConnectApp: {
    appName: 'GreatLoveMeta',
    description: 'GreatLoveMeta on-chain swap',
    icon: '<svg></svg>',
    logo: '<svg></svg>'
  },
  chain: {
    name: 'Polygon',
    chainId: 137,
    chainIdHex: '0x89',
    nativeCurrency: {
      name: 'POL',
      symbol: 'POL',
      decimals: 18
    },
    rpcUrls: [
      'https://polygon.drpc.org',
      'https://polygon.publicnode.com',
      'https://1rpc.io/matic'
    ],
    blockExplorerUrls: [
      'https://polygonscan.com'
    ]
  },
  contracts: {
    // StableSwapPolygon contract address. Change this only when the deployed swap contract changes.
    stableSwap: '0xe0a843e08c6544222cf3f576d356e395badfdcf6',
    usdtToken: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    glusdToken: '0xe982696d488a3a0372a34274e58d8abaa58faa2d'
  },
  symbols: {
    pay: 'USDT',
    receive: 'GLUSD'
  },
  history: {
    maxEvents: 20,
    scanBlocks: 5000000,
    chunkSize: 50000
  }
};
