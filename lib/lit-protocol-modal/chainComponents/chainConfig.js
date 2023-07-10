import { ethereumTypesConfig } from "./ethereum/ethereumTypesConfig";
import { solanaTypesConfig } from "./solana/solanaTypesConfig";

import { utils } from 'ethers';

const chainConfig = {
  ethereum: {
    value: 'ethereum',
    label: 'Ethereum',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'eth',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => utils.isAddress(walletAddress)
  },
  polygon: {
    value: 'polygon',
    label: 'Polygon',
    logo: '/images/cryptoLogos/polygon-matic-logo.svg',
    abbreviation: 'matic',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  solana: {
    value: 'solana',
    label: 'Solana',
    logo: '/images/cryptoLogos/solana-logo.svg',
    abbreviation: 'Sol',
    types: solanaTypesConfig,
    addressValidator: (walletAddress) => true
  },
  mantle: {
    value: 'mantle',
    label: 'Mantle',
    logo: '/images/cryptoLogos/mantle-logo.svg',
    abbreviation: 'mantle',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  fantom: {
    value: 'fantom',
    label: 'Fantom',
    logo: '/images/cryptoLogos/fantom-ftm-logo.svg',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  xdai: {
    value: 'xdai',
    label: 'xDai',
    logo: '/images/cryptoLogos/xdai-logo.svg',
    abbreviation: 'stake',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  bsc: {
    value: 'bsc',
    label: 'Binance Smart Chain',
    logo: '/images/cryptoLogos/bnb-logo.svg',
    abbreviation: 'bsc',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  arbitrum: {
    value: 'arbitrum',
    label: 'Arbitrum',
    logo: '/images/cryptoLogos/arbitrum.svg',
    abbreviation: 'arbitrum',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  avalanche: {
    value: 'avalanche',
    label: 'Avalanche',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    abbreviation: 'avax',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  optimism: {
    value: 'optimism',
    label: 'Optimism',
    logo: '/images/cryptoLogos/optimism.svg',
    abbreviation: 'op',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  celo: {
    value: 'celo',
    label: 'Celo',
    logo: '/images/cryptoLogos/celo-celo-logo.svg',
    abbreviation: 'celo',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  eluvio: {
    value: 'eluvio',
    label: 'Eluvio',
    logo: '/images/cryptoLogos/eluvio-logo.png',
    abbreviation: 'elv',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  fuji: {
    value: 'fuji',
    label: 'Avalanche FUJI Testnet',
    logo: '/images/cryptoLogos/avalanche-avax-logo.svg',
    abbreviation: 'fuji',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  harmony: {
    value: 'harmony',
    label: 'Harmony',
    logo: '/images/cryptoLogos/harmony-one-logo.svg',
    abbreviation: 'one',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  kovan: {
    value: 'kovan',
    label: 'Kovan',
    logo: '/images/cryptoLogos/kovan-logo.png',
    abbreviation: 'kovan',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  mumbai: {
    value: 'mumbai',
    label: 'Mumbai',
    logo: '/images/cryptoLogos/polygon-matic-logo.png',
    abbreviation: 'mumbai',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  goerli: {
    value: 'goerli',
    label: 'Goerli',
    logo: '/images/cryptoLogos/goerli-logo.png',
    abbreviation: 'goerli',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  ropstein: {
    value: 'ropstein',
    label: 'Ropstein',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'ropstein',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  rinkeby: {
    value: 'rinkeby',
    label: 'Rinkeby',
    logo: '/images/cryptoLogos/ethereum-eth-logo.svg',
    abbreviation: 'rinkeby',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  cronos: {
    value: 'cronos',
    label: 'Cronos',
    logo: '/images/cryptoLogos/cronos-logo.svg',
    abbreviation: 'cro',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
  aurora: {
    value: 'aurora',
    label: 'Aurora',
    logo: '/images/cryptoLogos/aurora-logo.svg',
    abbreviation: 'aoa',
    types: ethereumTypesConfig,
    addressValidator: (walletAddress) => true
  },
}

export {
  chainConfig
};