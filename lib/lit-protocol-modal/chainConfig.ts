import { ethereumTypesConfig } from "./chainComponents/ethereum/ethereumTypesConfig";
import { solanaTypesConfig } from "./chainComponents/solana/solanaTypesConfig";

import { utils, Wordlist, constants } from 'ethers';

type LitChainConfig = {
  value: string;
  label: string;
  logo: string;
  abbreviation: string;
  types: any;
  addressValidator: (walletAddress: string) => boolean;
}

// We don't these chains for now. Keeping this here for documentation purposes
export const unsupportedChains: Record<string, LitChainConfig> = {
  solana: {
    value: 'solana',
    label: 'Solana',
    logo: '/images/cryptoLogos/solana-logo.svg',
    abbreviation: 'Sol',
    types: solanaTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  eluvio: {
    value: 'eluvio',
    label: 'Eluvio',
    logo: '/images/cryptoLogos/eluvio-logo.png',
    abbreviation: 'elv',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  fuji: {
    value: 'fuji',
    label: 'Avalanche FUJI Testnet',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    abbreviation: 'fuji',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  kovan: {
    value: 'kovan',
    label: 'Kovan',
    logo: '/images/cryptoLogos/kovan-logo.png',
    abbreviation: 'kovan',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  ropstein: {
    value: 'ropstein',
    label: 'Ropstein',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'ropstein',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  cronos: {
    value: 'cronos',
    label: 'Cronos',
    logo: '/images/cryptoLogos/cronos-logo.svg',
    abbreviation: 'cro',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  aurora: {
    value: 'aurora',
    label: 'Aurora',
    logo: '/images/cryptoLogos/aurora-logo.svg',
    abbreviation: 'aoa',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
}

export const chainConfig = {
  ethereum: {
    value: 'ethereum',
    label: 'Ethereum',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'eth',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => utils.isAddress(walletAddress)
  },
  polygon: {
    value: 'polygon',
    label: 'Polygon',
    logo: '/images/cryptoLogos/polygon-matic-logo.svg',
    abbreviation: 'matic',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mantleTestnet: {
    value: 'mantleTestnet',
    label: 'Mantle',
    logo: '/images/cryptoLogos/mantle-logo.svg',
    abbreviation: 'mantleTestnet',
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
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  bsc: {
    value: 'bsc',
    label: 'Binance Smart Chain',
    logo: '/images/cryptoLogos/bnb-logo.svg',
    abbreviation: 'bsc',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  arbitrum: {
    value: 'arbitrum',
    label: 'Arbitrum',
    logo: '/images/cryptoLogos/arbitrum.svg',
    abbreviation: 'arbitrum',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  avalanche: {
    value: 'avalanche',
    label: 'Avalanche',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    abbreviation: 'avax',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  optimism: {
    value: 'optimism',
    label: 'Optimism',
    logo: '/images/cryptoLogos/optimism.svg',
    abbreviation: 'op',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  celo: {
    value: 'celo',
    label: 'Celo',
    logo: '/images/cryptoLogos/celo-celo-logo.svg',
    abbreviation: 'celo',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  harmony: {
    value: 'harmony',
    label: 'Harmony',
    logo: '/images/cryptoLogos/harmony-one-logo.svg',
    abbreviation: 'one',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  mumbai: {
    value: 'mumbai',
    label: 'Mumbai',
    logo: '/images/cryptoLogos/polygon-matic-logo.png',
    abbreviation: 'mumbai',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  goerli: {
    value: 'goerli',
    label: 'Goerli',
    logo: '/images/cryptoLogos/goerli-logo.png',
    abbreviation: 'goerli',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  },
  rinkeby: {
    value: 'rinkeby',
    label: 'Rinkeby',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'rinkeby',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress: string) => true
  }
}
