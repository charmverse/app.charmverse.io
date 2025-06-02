import { devTokenAddress, NULL_EVM_ADDRESS } from '@packages/subscriptions/constants';
import type { Address } from 'viem';
import type { Chain } from 'viem/chains';
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  sepolia,
  zora,
  zoraSepolia
} from 'viem/chains';

export type ChainOption = { name: string; id: number; icon: string; chain: Chain; usdcAddress: string };

export const chainOptionsMainnet: ChainOption[] = [
  {
    name: 'Optimism',
    id: optimism.id,
    icon: '/images/crypto/op.png',
    chain: optimism,
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
  },
  {
    name: 'Base',
    id: base.id,
    icon: '/images/crypto/base64.png',
    chain: base,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  },
  {
    name: 'Arbitrum',
    id: arbitrum.id,
    icon: '/images/crypto/arbitrum.png',
    chain: arbitrum,
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  { name: 'Zora', id: zora.id, icon: '/images/crypto/zora64.png', chain: zora, usdcAddress: '' }
  // no liquidity for USDC on mainnet
  // {
  //   name: 'Mainnet',
  //   id: mainnet.id,
  //   icon: '/images/crypto/ethereum-eth-logo.png',
  //   chain: mainnet,
  //   usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  // }
];

export const chainOptionsTestnet: ChainOption[] = [
  {
    name: 'Optimism Sepolia',
    id: optimismSepolia.id,
    icon: '/images/crypto/op.png',
    chain: optimismSepolia,
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7'
  },
  {
    name: 'Base Sepolia',
    id: baseSepolia.id,
    icon: '/images/crypto/base64.png',
    chain: baseSepolia,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
  },
  {
    name: 'Arbitrum Sepolia',
    id: arbitrumSepolia.id,
    icon: '/images/crypto/arbitrum.png',
    chain: arbitrumSepolia,
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
  },
  { name: 'Zora Sepolia', id: zoraSepolia.id, icon: '/images/crypto/zora64.png', chain: zoraSepolia, usdcAddress: '' },
  {
    name: 'Sepolia',
    id: sepolia.id,
    icon: '/images/crypto/ethereum-eth-logo.png',
    chain: sepolia,
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
  }
];

export type AvailableCurrency = 'ETH' | 'USDC' | 'DEV';

export type ChainWithCurrency = ChainOption & { currency: AvailableCurrency };

export type SelectedPaymentOption = { chainId: number; currency: AvailableCurrency };

export function getCurrencyContract({ currency, chainId }: SelectedPaymentOption): Address {
  if (currency === 'ETH') {
    return NULL_EVM_ADDRESS;
  }

  if (currency === 'DEV') {
    return devTokenAddress;
  }

  return (getChainOptions().find((chain) => chain.id === chainId)?.usdcAddress || '') as Address;
}

export function getChainOptions(opts: { useTestnets?: boolean } = { useTestnets: false }): ChainWithCurrency[] {
  const options = opts.useTestnets ? chainOptionsTestnet : chainOptionsMainnet;
  // Filter chains that have USDC and sort by Chain ID
  const usdcChains = options.filter((chain) => chain.usdcAddress).sort((a, b) => a.id - b.id);
  // Sort all chains by Chain ID for ETH
  const ethChains = options.sort((a, b) => a.id - b.id);

  // Create separate entries for USDC and ETH for each chain
  const usdcOptions = usdcChains.map((chain) => ({
    ...chain,
    currency: 'USDC' as AvailableCurrency
  }));
  const ethOptions = ethChains.map((chain) => ({
    ...chain,
    currency: 'ETH' as AvailableCurrency
  }));

  // Concatenate USDC options first, followed by ETH options
  return [...usdcOptions, ...ethOptions];

  // Revert this change once USDC mints work
  // return ethOptions;
}
