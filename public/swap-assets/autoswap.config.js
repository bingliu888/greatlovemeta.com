window.GREATLOVE_AUTOSWAP_CONFIG = {
  defaultMarketId: 'greatlove-default',
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
    description: 'GreatLoveMeta on-chain order market',
    icon: '<svg></svg>',
    logo: '<svg></svg>'
  },
  markets: [
    {
      id: 'greatlove-default',
      label: 'GreatLove AutoSwap',
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
        // AutoSwapLimitOrderBook address from the app's airdropContractAddress.
        orderBook: '0xedd1d9bfb02e956ff0195bf055542d40cee950ec',
        // Quote token address from the app's contract field.
        quoteToken: '0xe982696d488a3a0372a34274e58d8abaa58faa2d',
        // Base token address from the app's redeemContract field.
        baseToken: '0x6aa3a471765e8a9884e0e6edcb0f796bf9f0b325'
      },
      symbols: {
        quote: 'GLUSD',
        base: 'GLC'
      },
      history: {
        fromBlock: 0,
        maxEvents: 25,
        scanBlocks: 500000,
        chunkSize: 5000
      },
      orderBook: {
        priceLevelsPerSide: 12,
        ordersPerLevel: 8
      }
    }
  ]
};
