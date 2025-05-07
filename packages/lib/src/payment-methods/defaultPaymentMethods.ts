import type { PaymentMethod } from '@charmverse/core/prisma-client';
import { arbitrum, mainnet, optimism, polygon, sepolia } from 'viem/chains';

export const defaultPaymentMethods: Pick<
  PaymentMethod,
  'chainId' | 'contractAddress' | 'tokenLogo' | 'tokenSymbol' | 'tokenName' | 'tokenDecimals'
>[] = [
  {
    chainId: mainnet.id,
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  {
    chainId: sepolia.id,
    contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  {
    chainId: polygon.id,
    contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    tokenDecimals: 6,
    tokenName: 'USD Coin',
    tokenSymbol: 'USDC',
    tokenLogo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  {
    chainId: optimism.id,
    contractAddress: '0x4200000000000000000000000000000000000042',
    tokenDecimals: 18,
    tokenName: 'Optimism',
    tokenSymbol: 'OP',
    tokenLogo: 'https://optimistic.etherscan.io/token/images/optimism_32.png'
  },
  {
    chainId: arbitrum.id,
    contractAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    tokenDecimals: 18,
    tokenName: 'Arbitrum',
    tokenSymbol: 'ARB',
    tokenLogo: 'https://static.alchemyapi.io/images/assets/11841.png'
  }
];
