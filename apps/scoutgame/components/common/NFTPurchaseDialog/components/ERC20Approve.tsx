import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { getChainById } from '@packages/onchain/chains';
import { getPublicClient } from '@packages/onchain/getPublicClient';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { useState } from 'react';
import useSWR from 'swr';
import type { Address, Chain } from 'viem';
import { useAccount, useSendTransaction, useSwitchChain, useWalletClient } from 'wagmi';

import { MAX_UINT256, useUpdateERC20Allowance } from '../hooks/useUpdateERC20Allowance';

// Component for approving ERC20 tokens
type ERC20ApproveButtonProps = {
  onSuccess: () => void;
  amount?: bigint; // Optional amount input
  spender: Address;
  chainId: number;
  erc20Address: Address;
};

export function ERC20ApproveButton({ onSuccess, amount, chainId, erc20Address, spender }: ERC20ApproveButtonProps) {
  const [useUnlimited, setUseUnlimited] = useState(true);

  const { updateAllowance } = useUpdateERC20Allowance({ chainId, erc20Address, spender });

  const approvalAmount = useUnlimited
    ? MAX_UINT256 // Max uint256
    : amount || '0';

  return (
    <div>
      {amount && (
        <FormControlLabel
          control={<Checkbox checked={useUnlimited} onChange={() => setUseUnlimited(!useUnlimited)} color='primary' />}
          label='Approve Unlimited'
        />
      )}
      <Button
        variant='contained'
        color='primary'
        onClick={() => write?.()}
        disabled={isWriteLoading || isLoadingAllowance}
      >
        {isWriteLoading ? 'Approving...' : `Approve ${useUnlimited ? 'Unlimited' : amount}`}
      </Button>
      {allowance && <p>Current Allowance: {parseInt(allowance, 10)}</p>}
    </div>
  );
}
