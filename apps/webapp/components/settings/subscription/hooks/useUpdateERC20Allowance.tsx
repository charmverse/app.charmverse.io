import { log } from '@charmverse/core/log';
import { getChainById } from '@packages/blockchain/connectors/chains';
import useSWRMutation from 'swr/mutation';
import { publicActions, type Address, type Chain } from 'viem';
import { useWalletClient } from 'wagmi';

import { UsdcErc20ABIClient } from './usdcContractApiClient';

// Define a hook for checking allowances
export type UseERC20AllowanceProps = {
  spender: Address;
  erc20Address: Address;
  chainId: number;
};

export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

export function useUpdateERC20Allowance({ spender, erc20Address, chainId }: UseERC20AllowanceProps) {
  const { data: walletClient } = useWalletClient();

  async function mutationFn(_url: string, { arg: { amount } }: { arg: { amount: bigint } }) {
    if (!walletClient) {
      log.error('No wallet client found for update allowance');
    }
    const client = new UsdcErc20ABIClient({
      chain: getChainById(chainId)?.viem as Chain,
      contractAddress: erc20Address,
      walletClient: walletClient?.extend(publicActions)
    });
    await client.approve({ args: { spender, value: amount } });
  }

  const {
    trigger: triggerApproveSpender,
    isMutating: isApprovingSpender,
    error: errorApprovingSpender
    // not sure if we need walletClient, but sometimes it is undefined at first
  } = useSWRMutation(`updateAllowance-${walletClient?.account.address}`, mutationFn);

  return { triggerApproveSpender, isApprovingSpender, errorApprovingSpender };
}
