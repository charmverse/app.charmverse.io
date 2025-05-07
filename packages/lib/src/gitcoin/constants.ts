import { arbitrum, avalanche, base, fantom, mainnet, optimism, polygon, zkSync } from 'viem/chains';

import { endpoints } from './graphql/endpoints';

export const GITCOIN_SUPPORTED_CHAINS = Object.keys(endpoints).map(Number) as (keyof typeof endpoints)[];

export const PROJECT_REGISTRY_ADDRESSES = {
  // MAINNET
  [mainnet.id]: '0x03506eD3f57892C85DB20C36846e9c808aFe9ef4',
  // OPTIMISM
  [optimism.id]: '0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174',
  // FANTOM
  [fantom.id]: '0xAdcB64860902A29c3e408586C782A2221d595B55',
  // ARBITRUM
  [arbitrum.id]: '0x73AB205af1476Dc22104A6B8b3d4c273B58C6E27',
  // POLYGON
  [polygon.id]: '0x5C5E2D94b107C7691B08E43169fDe76EAAB6D48b',
  // AVALANCHE
  [avalanche.id]: '0xDF9BF58Aa1A1B73F0e214d79C652a7dd37a6074e',
  // ZKSYNC ERA
  [zkSync.id]: '0xe6CCEe93c97E20644431647B306F48e278aFFdb9',
  // BASE
  [base.id]: '0xA78Daa89fE9C1eC66c5cB1c5833bC8C6Cb307918'
} as const;
