import { ethereumTypesConfig } from './chainComponents/ethereum/ethereumTypesConfig';
import { solanaTypesConfig } from './chainComponents/solana/solanaTypesConfig';

import { utils, Wordlist, constants } from 'ethers';

type LitChainConfig = {
  value: string;
  label: string;
  logo: string;
  abbreviation: string;
  nativeToken?: string;
  types: any;
  addressValidator: (walletAddress: string) => boolean;
};

export const chainConfig = {
  ethereum: {
    value: 'ethereum',
    label: 'Ethereum',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'eth',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => utils.isAddress(walletAddress)
  },
  polygon: {
    value: 'polygon',
    label: 'Polygon',
    logo: '/images/cryptoLogos/polygon-matic-logo.svg',
    abbreviation: 'matic',
    nativeToken: 'MATIC',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mantle: {
    value: 'mantle',
    label: 'Mantle',
    logo: '/images/cryptoLogos/mantle-logo.svg',
    abbreviation: 'mantle',
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
    abbreviation: 'stake',
    nativeToken: 'XDAI',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  bsc: {
    value: 'bsc',
    label: 'Binance Smart Chain',
    logo: '/images/cryptoLogos/bnb-logo.svg',
    abbreviation: 'bsc',
    nativeToken: 'BNB',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  arbitrum: {
    value: 'arbitrum',
    label: 'Arbitrum',
    logo: '/images/cryptoLogos/arbitrum.svg',
    abbreviation: 'arbitrum',
    nativeToken: 'ARB',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  avalanche: {
    value: 'avalanche',
    label: 'Avalanche',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    abbreviation: 'avax',
    nativeToken: 'AVAX',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  optimism: {
    value: 'optimism',
    label: 'Optimism',
    logo: '/images/cryptoLogos/optimism.svg',
    abbreviation: 'op',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  celo: {
    value: 'celo',
    label: 'Celo',
    logo: '/images/cryptoLogos/celo-celo-logo.svg',
    abbreviation: 'celo',
    nativeToken: 'CELO',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  harmony: {
    value: 'harmony',
    label: 'Harmony',
    logo: '/images/cryptoLogos/harmony-one-logo.svg',
    abbreviation: 'one',
    nativeToken: 'ONE',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mumbai: {
    value: 'mumbai',
    label: 'Mumbai',
    logo: '/images/cryptoLogos/polygon-matic-logo.png',
    abbreviation: 'mumbai',
    nativeToken: 'MATIC',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  goerli: {
    value: 'goerli',
    label: 'Goerli',
    logo: '/images/cryptoLogos/goerli-logo.png',
    abbreviation: 'goerli',
    nativeToken: 'ETH',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  }
};
