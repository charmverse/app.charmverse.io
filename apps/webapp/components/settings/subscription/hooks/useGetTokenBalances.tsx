import { arrayUtils } from '@charmverse/core/utilities';
import type { UserTokenInfo } from '@decent.xyz/box-common';
import type { UserBalanceArgs } from '@decent.xyz/box-hooks';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import { devTokenAddress, NULL_EVM_ADDRESS } from '@packages/subscriptions/constants';
import { useEffect, useRef, useState } from 'react';
import type { Address } from 'viem';
import { createPublicClient, erc20Abi, http } from 'viem';
import { base } from 'viem/chains';

import { chainOptionsMainnet, getChainOptions } from '../components/ChainSelector/chains';

export type { UserTokenInfo };

export function useGetTokenBalances({ address }: { address: Address }) {
  const [scoutTokenInfo, setScoutTokenInfo] = useState<UserTokenInfo | null>(null);
  const fetchDevTokenInfoRef = useRef(false);

  // Regular token fetching logic
  const args: UserBalanceArgs = {
    chainId: base.id,
    selectChains: arrayUtils.uniqueValues([base.id, ...getChainOptions().map((opt) => opt.id)]),
    address,
    enable: !!address,
    selectTokens: arrayUtils.uniqueValues(
      chainOptionsMainnet
        .map((opt) => {
          if (opt.usdcAddress) {
            return [NULL_EVM_ADDRESS, opt.usdcAddress];
          }
          return [NULL_EVM_ADDRESS];
        })
        .flat()
    )
  };

  const result = useUsersBalances(args);

  useEffect(() => {
    async function fetchDevTokenInfo() {
      try {
        // Create a public client for Base chain
        const client = createPublicClient({
          chain: base,
          transport: http()
        });

        // Fetch token information from the contract
        const balance = await client.readContract({
          address: devTokenAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address]
        });

        // Calculate the human-readable balance
        const balanceFloat = Number(balance) / 10 ** 18;

        setScoutTokenInfo({
          address: devTokenAddress,
          chainId: base.id,
          name: 'Scout Protocol Token',
          symbol: 'DEV',
          decimals: 18,
          balance: BigInt(balance.toString()),
          balanceFloat,
          isNative: false,
          logo: '/images/crypto/base64.png'
        });
        fetchDevTokenInfoRef.current = true;
      } catch (error) {
        return null;
      }
    }

    if (!fetchDevTokenInfoRef.current) {
      fetchDevTokenInfo();
    }
  }, [address]);

  return {
    ...result,
    tokens: [...(result.tokens ?? []), ...(scoutTokenInfo ? [scoutTokenInfo] : [])]
  };
}
