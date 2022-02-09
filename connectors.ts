import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';

enum Chains {
  ETHEREUM = 1,
  BSC = 56,
  POLYGON = 137,
  AVALANCHE = 43114,
  XDAI = 100,
  FANTOM = 250,
  ARBITRUM = 42161,
  CELO = 42220,
  HARMONY = 1666600000,
  GOERLI = 5,
}

const RPC = {
  ETHEREUM: {
    chainId: 1,
    chainName: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000', // needed for proper form handling in the TokenFormCard component
      logoURI:
        'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
    },
    blockExplorerUrls: ['https://etherscan.io'],
    iconUrls: ['/networkLogos/ethereum.svg'],
    rpcUrls: ['https://main-light.eth.linkpool.io']
  },
  BSC: {
    chainId: '0x38',
    chainName: 'BSC',
    nativeCurrency: {
      name: 'Binance Coin',
      symbol: 'BNB',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png?1547034615'
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    iconUrls: ['/networkLogos/bsc.svg']
  },
  POLYGON: {
    chainId: '0x89',
    chainName: 'Matic',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    iconUrls: ['/networkLogos/polygon.svg']
  },
  AVALANCHE: {
    chainId: 43114,
    chainName: 'Avalanche Mainnet',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png?1604021818'
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    iconUrls: ['/networkLogos/avalanche.svg']
  },
  XDAI: {
    chainId: 100,
    chainName: 'xDAI Chain',
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'XDAI',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/11062/small/xdai.png?1614727492'
    },
    rpcUrls: ['https://rpc.xdaichain.com'],
    blockExplorerUrls: ['https://blockscout.com/poa/xdai'],
    iconUrls: ['/networkLogos/xdai.svg']
  },
  FANTOM: {
    chainId: 250,
    chainName: 'Fantom Opera',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4001/small/Fantom.png?1558015016'
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    iconUrls: ['/networkLogos/fantom.svg']
  },
  ARBITRUM: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'AETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    iconUrls: ['/networkLogos/arbitrum.svg']
  },
  CELO: {
    chainId: 42220,
    chainName: 'Celo Mainnet',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/11090/small/icon-celo-CELO-color-500.png?1592293590'
    },
    rpcUrls: ['https://forno.celo.org'],
    blockExplorerUrls: ['https://explorer.celo.org'],
    iconUrls: ['/networkLogos/celo.svg']
  },
  HARMONY: {
    chainId: 1666600000,
    chainName: 'Harmony',
    nativeCurrency: {
      name: 'Harmony',
      symbol: 'ONE',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4344/small/Y88JAze.png?1565065793'
    },
    rpcUrls: ['https://api.harmony.one'],
    blockExplorerUrls: ['https://explorer.harmony.one'],
    iconUrls: ['/networkLogos/harmony.svg']
  },
  GOERLI: {
    chainId: 5,
    chainName: 'Goerli Test Network',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000', // needed for proper form handling in the TokenFormCard component
      logoURI:
        'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
    },
    rpcUrls: ['https://goerli-light.eth.linkpool.io/'],
    blockExplorerUrls: ['https://goerli.etherscan.io/'],
    iconUrls: ['/networkLogos/ethereum.svg']
  }
} as const;

export type Blockchain = keyof typeof RPC;

const supportedChains = [
  'ETHEREUM',
  'POLYGON',
  'AVALANCHE',
  'XDAI',
  'FANTOM',
  'ARBITRUM',
  'CELO',
  'HARMONY',
  'BSC',
  'GOERLI'
] as const;

const supportedChainIds = supportedChains.map((_) => Chains[_]);

const injected = new InjectedConnector({ supportedChainIds });

const walletConnect = new WalletConnectConnector({
  supportedChainIds,
  rpc: Object.keys(RPC).reduce(
    (obj, chainName: string) => ({
      ...obj,
      // @ts-ignore
      [Chains[chainName]]: RPC[chainName].rpcUrls[0]
    }),
    {}
  ),
  qrcode: true
});

const walletLink = new WalletLinkConnector({
  url: 'https://app.charmverse.io',
  appName: 'CharmVerse.io',
  supportedChainIds
});

export { Chains, RPC, supportedChains, injected, walletConnect, walletLink };
