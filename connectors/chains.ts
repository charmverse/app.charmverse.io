import { log } from '@charmverse/core/log';
// ref: https://wagmi.sh/core/chains
import type { Chain } from 'viem/chains';
import {
  arbitrum,
  avalanche,
  base,
  baseGoerli,
  bsc,
  celo,
  fantom,
  goerli,
  gnosis,
  harmonyOne,
  mainnet,
  mantle,
  mantleTestnet,
  optimism,
  polygon,
  polygonMumbai,
  sepolia,
  zkSync,
  zkSyncTestnet,
  zora
} from 'viem/chains';

import { isProdEnv } from 'config/constants';
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
  alchemyUrl?: string;
  gnosisUrl?: string;
  iconUrl: string;
  testnet?: boolean;
  shortName: string;
  litNetwork?: string;
  viem: Chain;
}

// Gnosis endpoints: https://docs.safe.global/safe-core-api/available-services
// Alchemy endpoints: https://docs.alchemy.com/reference/nft-api-endpoints
// Lit networks: https://developer.litprotocol.com/v2/resources/supportedChains

const EVM_DEFAULT = {
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // needed for proper form handling in the TokenFormCard component
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880'
  }
};

/**
 * EIP-155 specifies developer and transaction shortnames for each network. You can find the list here
 * https://github.com/ethereum-lists/chains/tree/master/_data/chains
 */
const RPC: Record<string, IChainDetails> = {
  ETHEREUM: {
    ...EVM_DEFAULT,
    chainId: mainnet.id,
    viem: mainnet,
    chainName: 'Ethereum',
    alchemyUrl: 'https://eth-mainnet.g.alchemy.com',
    blockExplorerUrls: ['https://etherscan.io'],
    gnosisUrl: 'https://safe-transaction-mainnet.safe.global',
    iconUrl: '/images/cryptoLogos/ethereum-eth-logo.svg',
    rpcUrls: ['https://eth.llamarpc.com'],
    shortName: 'eth',
    litNetwork: 'ethereum'
  },
  GOERLI: {
    ...EVM_DEFAULT,
    chainId: goerli.id,
    viem: goerli,
    chainName: 'Ethereum - Goerli',
    alchemyUrl: 'https://eth-goerli.g.alchemy.com',
    rpcUrls: ['https://goerli-light.eth.linkpool.io/'],
    blockExplorerUrls: ['https://goerli.etherscan.io/'],
    gnosisUrl: 'https://safe-transaction-goerli.safe.global',
    iconUrl: '/images/cryptoLogos/ethereum-eth-logo.svg',
    testnet: true,
    shortName: 'gor',
    litNetwork: 'goerli'
  },
  SEPOLIA: {
    ...EVM_DEFAULT,
    chainId: sepolia.id,
    viem: sepolia,
    chainName: 'Ethereum - Sepolia',
    rpcUrls: ['https://ethereum-sepolia.blockpi.network/v1/rpc/public'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
    iconUrl: '/images/cryptoLogos/ethereum-eth-logo.svg',
    testnet: true,
    shortName: 'sep'
  },
  OPTIMISM: {
    ...EVM_DEFAULT,
    chainId: optimism.id,
    viem: optimism,
    chainName: 'Optimism',
    alchemyUrl: 'https://opt-mainnet.g.alchemy.com',
    rpcUrls: ['https://mainnet.optimism.io'],
    gnosisUrl: 'https://safe-transaction-optimism.safe.global',
    blockExplorerUrls: ['https://optimistic.etherscan.io/'],
    iconUrl: '/images/cryptoLogos/optimism.svg',
    shortName: 'oeth',
    litNetwork: 'optimism'
  },
  // https://docs.base.org/network-information/
  BASE: {
    ...EVM_DEFAULT,
    chainId: base.id,
    viem: base,
    chainName: 'Base',
    alchemyUrl: 'https://base-mainnet.g.alchemy.com',
    rpcUrls: ['https://mainnet.base.org'],
    gnosisUrl: 'https://safe-transaction-base.safe.global',
    blockExplorerUrls: ['https://basescan.org'],
    iconUrl: '/images/cryptoLogos/base-logo.svg',
    shortName: 'base',
    litNetwork: 'base'
  },
  BASE_TESTNET: {
    ...EVM_DEFAULT,
    chainId: baseGoerli.id,
    viem: baseGoerli,
    chainName: 'Base - Goerli Testnet',
    rpcUrls: ['https://goerli.base.org'],
    gnosisUrl: 'https://safe-transaction-base-testnet.safe.global',
    blockExplorerUrls: ['https://goerli.basescan.org'],
    iconUrl: '/images/cryptoLogos/base-logo.svg',
    shortName: 'base-testnet',
    testnet: true,
    litNetwork: 'baseGoerli'
  },
  // https://docs.zora.co/docs/zora-network/network
  ZORA: {
    ...EVM_DEFAULT,
    chainId: zora.id,
    viem: zora,
    chainName: 'Zora',
    rpcUrls: ['https://rpc.zora.energy'],
    blockExplorerUrls: ['https://explorer.zora.energy'],
    iconUrl: '/images/cryptoLogos/zora-logo.svg',
    shortName: 'zora',
    litNetwork: 'zora'
  },
  POLYGON: {
    chainId: polygon.id,
    viem: polygon,
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    alchemyUrl: 'https://polygon-mainnet.g.alchemy.com',
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    gnosisUrl: 'https://safe-transaction-polygon.safe.global',
    iconUrl: '/images/cryptoLogos/polygon-matic-logo.svg',
    litNetwork: 'polygon',
    shortName: 'matic'
  },
  MUMBAI: {
    chainId: polygonMumbai.id,
    viem: polygonMumbai,
    chainName: 'Polygon - Mumbai',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000',
      logoURI: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png?1624446912'
    },
    alchemyUrl: 'https://polygon-mumbai.g.alchemy.com',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com', 'https://polygon-mumbai-bor.publicnode.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    iconUrl: '/images/cryptoLogos/polygon-matic-logo.svg',
    testnet: true,
    shortName: 'maticmum',
    litNetwork: 'mumbai'
  },
  ARBITRUM: {
    ...EVM_DEFAULT,
    chainId: arbitrum.id,
    viem: arbitrum,
    chainName: 'Arbitrum One',
    alchemyUrl: 'https://arb-mainnet.g.alchemy.com',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    gnosisUrl: 'https://safe-transaction-arbitrum.safe.global',
    iconUrl: '/images/cryptoLogos/arbitrum.svg',
    shortName: 'arb1',
    litNetwork: 'arbitrum'
  },
  AVALANCHE: {
    chainId: avalanche.id,
    viem: avalanche,
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
    shortName: 'avax',
    litNetwork: 'avalanche'
  },
  BSC: {
    chainId: bsc.id,
    viem: bsc,
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
    shortName: 'bnb',
    litNetwork: 'bsc'
  },
  XDAI: {
    chainId: gnosis.id,
    viem: gnosis,
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
    iconUrl: '/images/cryptoLogos/gnosis-logo.svg',
    shortName: 'gno',
    litNetwork: 'xdai'
  },
  FANTOM: {
    chainId: fantom.id,
    viem: fantom,
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
    shortName: 'ftm',
    litNetwork: 'fantom'
  },
  CELO: {
    chainId: celo.id,
    viem: celo,
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
    shortName: 'celo',
    litNetwork: 'celo'
  },
  HARMONY: {
    chainId: harmonyOne.id,
    viem: harmonyOne,
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
    shortName: 'hmy-s0',
    litNetwork: 'harmony'
  },
  HARMONY_DEVNET: {
    chainId: 1666900000,
    viem: harmonyOne,
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
  ZKSYNC: {
    ...EVM_DEFAULT,
    chainId: zkSync.id,
    viem: zkSync,
    chainName: 'zkSync Era',
    rpcUrls: ['https://mainnet.era.zksync.io'],
    blockExplorerUrls: ['https://explorer.zksync.io'],
    iconUrl: '/images/cryptoLogos/zksync-era-logo.svg',
    shortName: 'zksync'
  },
  ZKSYNC_DEV: {
    ...EVM_DEFAULT,
    chainId: zkSyncTestnet.id,
    viem: zkSyncTestnet,
    chainName: 'zkSync Era Testnet',
    rpcUrls: ['https://testnet.era.zksync.dev'],
    blockExplorerUrls: ['https://goerli.explorer.zksync.io'],
    iconUrl: '/images/cryptoLogos/zksync-era-logo.svg',
    shortName: 'zksync-goerli'
  },
  MANTLE: {
    chainId: mantle.id,
    viem: mantle,
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
    shortName: 'mantle',
    litNetwork: 'mantle'
  },
  MANTLE_TESTNET: {
    chainId: mantleTestnet.id,
    viem: mantleTestnet,
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
    testnet: true,
    litNetwork: 'mantleTestnet'
  }
} as const;

export type Blockchain = keyof typeof RPC;

export const RPCList = Object.values(RPC)
  // filter out testnets in prod, except for Goerli
  .filter((chain) => !isProdEnv || !chain.testnet || chain.chainId === goerli.id);

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

export function getChainExplorerLink(
  chainId: string | number,
  transactionOrContractId: string,
  endpoint: 'transaction' | 'address' = 'transaction'
): string {
  chainId = chainId.toString();

  const path = endpoint === 'transaction' ? 'tx' : 'token';
  const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
  const config = getChainById(chainIdNum);
  if (config) {
    return `${config.blockExplorerUrls[0]}/${path}/${transactionOrContractId}`;
  }
  log.warn('Mising chain explorer link for network', { chainId, endpoint });
  return '';
}

export type IChainDetailsWithLit = IChainDetails & { litNetwork: NonNullable<IChainDetails['litNetwork']> };

export const litChainList: IChainDetailsWithLit[] = RPCList.filter(
  (chain): chain is IChainDetailsWithLit => !!chain.litNetwork
);

export const getChainDetailsFromLitNetwork = (network?: string) => {
  return litChainList.find((chain) => chain.litNetwork === network);
};
