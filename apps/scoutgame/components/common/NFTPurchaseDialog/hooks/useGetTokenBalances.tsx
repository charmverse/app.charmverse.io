import { arrayUtils } from '@charmverse/core/utilities';
import { ChainId } from '@decent.xyz/box-common';
import type { UserBalanceArgs } from '@decent.xyz/box-hooks';
import { useUsersBalances } from '@decent.xyz/box-hooks';
import type { Address } from 'viem';

import { chainOptionsMainnet, ETH_NATIVE_ADDRESS, getChainOptions } from '../components/ChainSelector/chains';

export function useGetTokenBalances({ address }: { address: Address }) {
  const args: UserBalanceArgs = {
    chainId: ChainId.OPTIMISM,
    selectChains: arrayUtils.uniqueValues(getChainOptions().map((opt) => opt.id)),
    address,
    enable: !!address,
    selectTokens: arrayUtils.uniqueValues(
      chainOptionsMainnet
        .map((opt) => {
          if (opt.usdcAddress) {
            return [ETH_NATIVE_ADDRESS, opt.usdcAddress];
          }
          return [ETH_NATIVE_ADDRESS];
        })
        .flat()
    )
  };

  return useUsersBalances(args);
}
