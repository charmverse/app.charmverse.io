import { ethereumTypesConfig } from './chainComponents/ethereum/ethereumTypesConfig';

import { isAddress } from 'viem';

type LitChainConfig = {
  value: string;
  label: string;
  logo: string;
  nativeToken?: string;
  types: any;
  addressValidator: (walletAddress: string) => boolean;
};

export const chainConfig = {
  ethereum: {
    value: 'ethereum',
    label: 'Ethereum',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => isAddress(walletAddress)
  },
  polygon: {
    value: 'polygon',
    label: 'Polygon',
    logo: '/images/cryptoLogos/polygon-matic-logo.svg',
    nativeToken: 'MATIC',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mantleTestnet: {
    value: 'mantleTestnet',
    label: 'Mantle Testnet',
    logo: '/images/cryptoLogos/mantle-logo.svg',
    nativeToken: 'MNT',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mantle: {
    value: 'mantle',
    label: 'Mantle',
    logo: '/images/cryptoLogos/mantle-logo.svg',
    nativeToken: 'MNT',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  fantom: {
    value: 'fantom',
    label: 'Fantom',
    logo: '/images/cryptoLogos/fantom-ftm-logo.svg',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  xdai: {
    value: 'xdai',
    label: 'xDai',
    logo: '/images/cryptoLogos/xdai-logo.svg',
    nativeToken: 'XDAI',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  bsc: {
    value: 'bsc',
    label: 'Binance Smart Chain',
    logo: '/images/cryptoLogos/bnb-logo.svg',
    nativeToken: 'BNB',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  arbitrum: {
    value: 'arbitrum',
    label: 'Arbitrum',
    logo: '/images/cryptoLogos/arbitrum.svg',
    nativeToken: 'ARB',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  avalanche: {
    value: 'avalanche',
    label: 'Avalanche',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    nativeToken: 'AVAX',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  optimism: {
    value: 'optimism',
    label: 'Optimism',
    logo: '/images/cryptoLogos/optimism.svg',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  celo: {
    value: 'celo',
    label: 'Celo',
    logo: '/images/cryptoLogos/celo-celo-logo.svg',
    nativeToken: 'CELO',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  harmony: {
    value: 'harmony',
    label: 'Harmony',
    logo: '/images/cryptoLogos/harmony-one-logo.svg',
    nativeToken: 'ONE',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  zksync: {
    value: 'zksync',
    label: 'zkSync',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  zkEvm: {
    value: 'zkEvm',
    label: 'Polygon zkEVM',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mumbai: {
    value: 'mumbai',
    label: 'Mumbai',
    logo: '/images/cryptoLogos/polygon-matic-logo.svg',
    nativeToken: 'MATIC',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  goerli: {
    value: 'goerli',
    label: 'Goerli',
    logo: '/images/cryptoLogos/goerli-logo.png',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  zksyncTestnet: {
    value: 'zksyncTestnet',
    label: 'zkSync Testnet',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  }
};
