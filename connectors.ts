import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';
import { WalletLinkConnector } from '@web3-react/walletlink-connector';

import { uniqueValues } from 'lib/utilities/array';

export interface IChainDetails {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    logoURI: string;
  };
  rpcUrls: readonly string[];
  blockExplorerUrls: readonly string[];
  gnosisUrl?: string;
  iconUrl: string;
  testnet?: boolean;
}

// Gnosis endpoints: https://docs.gnosis-safe.io/backend/available-services

/**
 * EIP-155 specifies developer and transaction shortnames for each network. You can find the list here
 * https://github.com/ethereum-lists/chains/tree/master/_data/chains
 */
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
    gnosisUrl: 'https://safe-transaction.mainnet.gnosis.io',
    iconUrl: '/images/cryptoLogos/eth-diamond-purple.png',
    rpcUrls: ['https://main-light.eth.linkpool.io'],
    shortName: 'eth'
  },
  BSC: {
    chainId: 56,
    chainName: 'Binance Smart Chain',
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
    gnosisUrl: 'https://safe-transaction.bsc.gnosis.io',
    iconUrl: '/images/cryptoLogos/binance-coin-bnb-logo.svg',
    shortName: 'bnb'
  },
  POLYGON: {
    chainId: 137,
    chainName: 'Polygon',
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
    gnosisUrl: 'https://safe-transaction.polygon.gnosis.io',
    iconUrl: '/images/cryptoLogos/polygon-matic-logo.svg',
    shortName: 'matic'
  },
  AVALANCHE: {
    chainId: 43114,
    chainName: 'Avalanche',
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
    gnosisUrl: 'https://safe-transaction.avalanche.gnosis.io',
    iconUrl: '/images/cryptoLogos/avalanche-avax-logo.svg',
    shortName: 'avax'
  },
  XDAI: {
    chainId: 100,
    chainName: 'Gnosis',
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
    gnosisUrl: 'https://safe-transaction.xdai.gnosis.io',
    iconUrl: '/images/cryptoLogos/gnosis-xdai-logo.svg',
    shortName: 'gno'
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
    iconUrl: '/images/cryptoLogos/fantom.svg',
    shortName: 'ftm'
  },
  ARBITRUM: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    gnosisUrl: 'https://safe-transaction.arbitrum.gnosis.io',
    iconUrl: '/images/cryptoLogos/arbitrum.svg',
    shortName: 'arb1'
  },
  CELO: {
    chainId: 42220,
    chainName: 'Celo',
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
    iconUrl: '/images/cryptoLogos/celo-celo-logo.svg',
    shortName: 'celo'
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
    iconUrl: '/images/cryptoLogos/harmony-one-logo.svg',
    shortName: 'hmy-s0'
  },
  HARMONY_DEVNET: {
    chainId: 1666900000,
    chainName: 'Harmony - Devnet',
    nativeCurrency: {
      name: 'Harmony',
      symbol: 'ONE',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4344/small/Y88JAze.png?1565065793'
    },
    rpcUrls: ['https://api.s0.ps.hmny.io'],
    blockExplorerUrls: ['https://explorer.ps.hmny.io/'],
    iconUrl: '/images/cryptoLogos/harmony-one-logo.svg',
    shortName: 'hmy-ps-s0'
  },
  GOERLI: {
    chainId: 5,
    chainName: 'Ethereum - Goerli',
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
    gnosisUrl: 'https://safe-transaction.goerli.gnosis.io',
    iconUrl: '/images/cryptoLogos/eth-diamond-purple.png',
    testnet: true,
    shortName: 'gor'

  },
  MUMBAI: {
    chainId: 80001,
    chainName: 'Polygon - Mumbai',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    rpcUrls: ['https://rpc-mumbai.matic.today'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    iconUrl: '/images/cryptoLogos/polygon-matic-logo.svg',
    testnet: true,
    shortName: 'maticmum'
  },
  OPTIMISM: {
    chainId: 10,
    chainName: 'Optimism',
    nativeCurrency: {
      name: 'Optimism',
      symbol: 'OP',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI:
        'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    rpcUrls: ['https://mainnet.optimism.io'],
    blockExplorerUrls: ['https://optimistic.etherscan.io/'],
    iconUrl: '/images/cryptoLogos/optimism.svg',
    testnet: true,
    shortName: 'oeth'
  }
} as const;

export type Blockchain = keyof typeof RPC;

export const RPCList = Object.values(RPC);

export function getChainShortname (chainId: string | number): string {
  const parsedChainId = parseInt(chainId.toString());
  return RPCList.find(chain => chain.chainId === parsedChainId)?.shortName ?? '';
}

export type CryptoCurrency = typeof RPC[Blockchain]['nativeCurrency']['symbol'];

export const CryptoCurrencyList = Object.values(RPC).reduce((acc, chain) => {
  acc[chain.nativeCurrency.symbol] = chain.nativeCurrency.name;
  return acc;
}, {} as Record<CryptoCurrency, string>);

export const TokenLogoPaths = Object.values(RPC).reduce((acc, chain) => {
  acc[chain.nativeCurrency.symbol] = chain.iconUrl;
  return acc;
}, {} as Record<CryptoCurrency, string>);

export const CryptoCurrencies = uniqueValues<CryptoCurrency>(RPCList.map(chain => {
  return chain.nativeCurrency.symbol as CryptoCurrency;
}));

export const FiatCurrencyList = {
  USD: 'US Dollar',
  GBP: 'British Pound Sterling',
  EUR: 'Euro',
  JPY: 'Japanese Yen'
};

export type FiatCurrency = keyof typeof FiatCurrencyList;

export type Currency = CryptoCurrency | FiatCurrency;

export interface ICurrencyPair {
  base: CryptoCurrency | string;
  quote: FiatCurrency;
}

export interface IPairQuote extends ICurrencyPair {
  amount: number;
  receivedOn?: number | Date;
  source?: string;
}

export function getChainById (chainId: number): IChainDetails | undefined {
  return RPCList.find(rpc => rpc.chainId === chainId);
}

const supportedChains: Blockchain[] = [
  'ETHEREUM',
  'POLYGON',
  'AVALANCHE',
  'XDAI',
  'FANTOM',
  'ARBITRUM',
  'CELO',
  'HARMONY',
  'HARMONY_DEVNET',
  'BSC',
  'OPTIMISM',
  'GOERLI',
  'MUMBAI'
];

const supportedChainIds = supportedChains.map((_) => RPC[_].chainId);

const injected = new InjectedConnector({ supportedChainIds });

const walletConnect = new WalletConnectConnector({
  supportedChainIds,
  rpc: Object.keys(RPC).reduce(
    (obj, chainName: string) => ({
      ...obj,
      // @ts-ignore
      [RPC[chainName].chainId]: RPC[chainName].rpcUrls[0]
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

/**
 *
 * @param chainId
 * @returns The native crypto of a chain. If the chain is not found, returns an empty list
 */
export function getCryptos (chainId: number): (string | CryptoCurrency)[] {
  const chain = getChainById(chainId);

  if (!chain) {
    return [];
  }

  return [chain.nativeCurrency.symbol];

}

export function getChainExplorerLink (chainId: string | number, transactionOrContractId: string, endpoint: 'transaction' | 'address' = 'transaction'): string {

  chainId = chainId.toString();

  const path = endpoint === 'transaction' ? 'tx' : 'token';

  switch (chainId) {

    case '1':
      return `https://etherscan.io/${path}/${transactionOrContractId}`;

    case '0x38':
    case '56':
      return `https://bscscan.com/${path}/${transactionOrContractId}`;

    case '0x89':
    case '137':
      return `https://polygonscan.com/${path}/${transactionOrContractId}`;

    case '43114':
      return `https://snowtrace.io/${path}/${transactionOrContractId}`;

    case '100':
      return `https://explorer.poa.network/xdai/mainnet/${path}/${transactionOrContractId}`;

    case '250':
      return `https://ftmscan.com/${path}/${transactionOrContractId}`;

    case '42161':
      return `https://arbiscan.io/${path}/${transactionOrContractId}`;

    case '42220':
      return `https://explorer.celo.org/${path}/${transactionOrContractId}`;

    case '1666600000':
      return `https://explorer.harmony.one/${path}/${transactionOrContractId}`;

    case '5':
      return `https://goerli.etherscan.io/${path}/${transactionOrContractId}`;

    case '4':
      return `https://rinkeby.etherscan.io/${path}/${transactionOrContractId}`;

    case '80001':
      return `https://mumbai.polygonscan.com/${path}/${transactionOrContractId}`;

    default:
      return '';
  }
}

export { RPC, supportedChains, injected, walletConnect, walletLink };
