import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ChainId } from '@decent.xyz/box-common';
import { NULL_EVM_ADDRESS } from '@packages/subscriptions/constants';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';

const optimismTokenDecimals = 18;
const optimismTokenAddress = '0x4200000000000000000000000000000000000042';
const OPTIMISM_USDC_ADDRESS = '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

type TokenBalance = {
  address: Address;
  chainId: number;
  balance: number;
  symbol: string;
  name: string;
  decimals: number;
};

type DecentTokenResponse = {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  isNative: boolean;
  logo?: string;
  balanceFloat: number;
  balance: string;
};

const DECENT_API_BASE_URL = 'https://box-v4.api.decent.xyz/api';

async function fetchTokenBalances(params: {
  address: Address;
  chainId: number;
  additionalTokens: Address[];
}): Promise<DecentTokenResponse[]> {
  const apiKey = env('DECENT_API_KEY') || process.env.REACT_APP_DECENT_API_KEY;

  if (!apiKey) {
    throw new Error('Decent API key not found');
  }

  const queryParams = new URLSearchParams({
    address: params.address,
    additionalTokens: params.additionalTokens.join(','),
    chainId: params.chainId.toString()
  });

  const response = await fetch(`${DECENT_API_BASE_URL}/getTokens?${queryParams}`, {
    headers: {
      'x-api-key': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch token balances: ${response.statusText}`);
  }

  return response.json();
}

function filterAndMapTokens(tokens: DecentTokenResponse[]): TokenBalance[] {
  const TRACKED_TOKENS = [
    NULL_EVM_ADDRESS.toLowerCase(),
    BASE_USDC_ADDRESS.toLowerCase(),
    OPTIMISM_USDC_ADDRESS.toLowerCase(),
    devTokenAddress.toLowerCase()
  ];

  return tokens
    .filter((token) => TRACKED_TOKENS.includes(token.address.toLowerCase()))
    .map((token) => ({
      address: token.address as Address,
      chainId: token.chainId,
      balance: token.balanceFloat,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals
    }));
}

export function useGetTokenBalances({ address }: { address: Address }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      if (!address) return;

      setIsLoading(true);
      try {
        const [baseTokens, optimismTokens] = await Promise.all([
          fetchTokenBalances({
            address,
            chainId: ChainId.BASE,
            additionalTokens: [NULL_EVM_ADDRESS, BASE_USDC_ADDRESS, devTokenContractAddress]
          }),
          fetchTokenBalances({
            address,
            chainId: ChainId.OPTIMISM,
            additionalTokens: [NULL_EVM_ADDRESS, OPTIMISM_USDC_ADDRESS]
          })
        ]);

        const allTokens = filterAndMapTokens([...baseTokens, ...optimismTokens]);
        setTokens(allTokens);
      } catch (error) {
        log.error('Error fetching token balances:', { error });
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBalances();
  }, [address]);

  return {
    tokens,
    isLoading
  };
}
