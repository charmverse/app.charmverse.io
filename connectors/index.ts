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
  shortName: string;
}

// Retrieve Gnosis endpoints: https://docs.safe.global/safe-core-api/available-services

const EVM_DEFAULT = {
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // needed for proper form handling in the TokenFormCard component
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
  },
  iconUrl: '/images/cryptoLogos/eth-diamond-purple.png'
};

/**
 * EIP-155 specifies developer and transaction shortnames for each network. You can find the list here
 * https://github.com/ethereum-lists/chains/tree/master/_data/chains
 */
const RPC = {
  ETHEREUM: {
    ...EVM_DEFAULT,
    chainId: 1,
    chainName: 'Ethereum',
    blockExplorerUrls: ['https://etherscan.io'],
    gnosisUrl: 'https://safe-transaction-mainnet.safe.global',
    rpcUrls: ['https://eth.llamarpc.com'],
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
      logoURI: 'https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png?1547034615'
    },
    rpcUrls: ['https://bsc-dataseed.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    gnosisUrl: 'https://safe-transaction-bsc.safe.global',
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
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    gnosisUrl: 'https://safe-transaction-polygon.safe.global',
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
      logoURI: 'https://assets.coingecko.com/coins/images/12559/small/coin-round-red.png?1604021818'
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    gnosisUrl: 'https://safe-transaction-avalanche.safe.global',
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
      logoURI: 'https://assets.coingecko.com/coins/images/11062/small/xdai.png?1614727492'
    },
    rpcUrls: ['https://rpc.xdaichain.com'],
    blockExplorerUrls: ['https://blockscout.com/poa/xdai'],
    gnosisUrl: 'https://safe-transaction-gnosis-chain.safe.global',
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
      logoURI: 'https://assets.coingecko.com/coins/images/4001/small/Fantom.png?1558015016'
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    iconUrl: '/images/cryptoLogos/fantom.svg',
    shortName: 'ftm'
  },
  ARBITRUM: {
    ...EVM_DEFAULT,
    chainId: 42161,
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    gnosisUrl: 'https://safe-transaction-arbitrum.safe.global',
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
      logoURI: 'https://assets.coingecko.com/coins/images/11090/small/icon-celo-CELO-color-500.png?1592293590'
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
      logoURI: 'https://assets.coingecko.com/coins/images/4344/small/Y88JAze.png?1565065793'
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
      logoURI: 'https://assets.coingecko.com/coins/images/4344/small/Y88JAze.png?1565065793'
    },
    rpcUrls: ['https://api.s0.ps.hmny.io'],
    blockExplorerUrls: ['https://explorer.ps.hmny.io/'],
    iconUrl: '/images/cryptoLogos/harmony-one-logo.svg',
    shortName: 'hmy-ps-s0',
    testnet: true
  },
  GOERLI: {
    ...EVM_DEFAULT,
    chainId: 5,
    chainName: 'Ethereum - Goerli',
    rpcUrls: ['https://goerli-light.eth.linkpool.io/'],
    blockExplorerUrls: ['https://goerli.etherscan.io/'],
    gnosisUrl: 'https://safe-transaction-goerli.safe.global',
    testnet: true,
    shortName: 'gor'
  },
  SEPOLIA: {
    ...EVM_DEFAULT,
    chainId: 11155111,
    chainName: 'Ethereum - Sepolia',
    rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    testnet: true,
    shortName: 'sep'
  },
  MUMBAI: {
    chainId: 80001,
    chainName: 'Mumbai',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com', 'https://polygon-mumbai-bor.publicnode.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    iconUrl: '/images/cryptoLogos/polygon-matic-logo.svg',
    testnet: true,
    shortName: 'maticmum'
  },
  OPTIMISM: {
    ...EVM_DEFAULT,
    chainId: 10,
    chainName: 'Optimism',
    rpcUrls: ['https://mainnet.optimism.io'],
    gnosisUrl: 'https://safe-transaction-optimism.safe.global',
    blockExplorerUrls: ['https://optimistic.etherscan.io/'],
    shortName: 'oeth'
  },
  ZKSYNC: {
    ...EVM_DEFAULT,
    chainId: 324,
    chainName: 'zkSync Era',
    rpcUrls: ['https://mainnet.era.zksync.io'],
    blockExplorerUrls: ['https://explorer.zksync.io'],
    iconUrl: '/images/cryptoLogos/zksync-era-logo.svg',
    shortName: 'zksync'
  },
  MANTLE: {
    chainId: 5000,
    chainName: 'Mantle',
    nativeCurrency: {
      name: 'Mantle',
      symbol: 'MNT',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI: 'https://cryptototem.com/wp-content/uploads/2023/01/Mantle-logo.jpg'
    },
    rpcUrls: ['https://rpc.mantle.xyz'],
    blockExplorerUrls: ['https://explorer.mantle.xyz'],
    iconUrl: '/images/cryptoLogos/mantle-logo.svg',
    gnosisUrl: 'https://gateway.multisig.mantle.xyz',
    shortName: 'mantle'
  },
  MANTLE_TESTNET: {
    chainId: 5001,
    chainName: 'Mantle - Testnet',
    nativeCurrency: {
      name: 'Testnet Mantle',
      symbol: 'MNT',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI: 'https://cryptototem.com/wp-content/uploads/2023/01/Mantle-logo.jpg'
    },
    rpcUrls: ['https://rpc.testnet.mantle.xyz'],
    gnosisUrl: 'https://gateway.multisig.mantle.xyz',
    blockExplorerUrls: ['https://explorer.testnet.mantle.xyz'],
    iconUrl: '/images/cryptoLogos/mantle-logo.svg',
    shortName: 'mantle-testnet',
    testnet: true
  },
  // https://docs.base.org/network-information/
  BASE: {
    ...EVM_DEFAULT,
    chainId: 8453,
    chainName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
    gnosisUrl: 'https://safe-transaction-base.safe.global',
    blockExplorerUrls: ['https://basescan.org'],
    iconUrl: '/images/cryptoLogos/base-logo.svg',
    shortName: 'base'
  },
  BASE_TESTNET: {
    ...EVM_DEFAULT,
    chainId: 84531,
    chainName: 'Base - Testnet',
    rpcUrls: ['https://goerli.base.org'],
    gnosisUrl: 'https://safe-transaction-base-testnet.safe.global',
    blockExplorerUrls: ['https://goerli.basescan.org'],
    iconUrl: '/images/cryptoLogos/base-logo.svg',
    shortName: 'base-testnet',
    testnet: true
  },
  // https://docs.zora.co/docs/zora-network/network
  ZORA: {
    ...EVM_DEFAULT,
    chainId: 7777777,
    chainName: 'Zora',
    rpcUrls: ['https://rpc.zora.energy'],
    blockExplorerUrls: ['https://explorer.zora.energy'],
    iconUrl: '/images/cryptoLogos/zora-logo.svg',
    shortName: 'zora'
  }
} as const;

export type Blockchain = keyof typeof RPC;

export const RPCList = Object.values(RPC);

export function getChainShortname(chainId: string | number): string {
  const parsedChainId = parseInt(chainId.toString());
  return RPCList.find((chain) => chain.chainId === parsedChainId)?.shortName ?? '';
}

export type CryptoCurrency = (typeof RPC)[Blockchain]['nativeCurrency']['symbol'];

export const CryptoCurrencies = uniqueValues<CryptoCurrency>(
  RPCList.map((chain) => {
    return chain.nativeCurrency.symbol as CryptoCurrency;
  })
);

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

export function getChainById(chainId: number): IChainDetails | undefined {
  return RPCList.find((rpc) => rpc.chainId === chainId);
}

export function getChainBySymbol(tokenSymbol: string): IChainDetails | undefined {
  return RPCList.find((rpc) => rpc.nativeCurrency.symbol === tokenSymbol);
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
  'GOERLI',
  'OPTIMISM',
  'SEPOLIA',
  'MUMBAI',
  'ZKSYNC',
  'MANTLE_TESTNET',
  'MANTLE'
];

const supportedChainIds = supportedChains.map((_) => RPC[_].chainId);

export function getChainExplorerLink(
  chainId: string | number,
  transactionOrContractId: string,
  endpoint: 'transaction' | 'address' = 'transaction'
): string {
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

    case '10':
      return `https://optimistic.etherscan.io/${path}/${transactionOrContractId}`;

    case '324':
      return `https://explorer.zksync.io/${path}/${transactionOrContractId}`;

    case '5000':
      return `https://explorer.mantle.xyz/${path}/${transactionOrContractId}`;

    case '5001':
      return `https://explorer.testnet.mantle.xyz/${path}/${transactionOrContractId}`;
    default:
      return '';
  }
}

export { RPC, supportedChains, supportedChainIds };
