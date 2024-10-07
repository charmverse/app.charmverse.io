import { Button, Checkbox, FormControlLabel } from '@mui/material';
import Stack from '@mui/material/Stack';
import { useState } from 'react';
import type { Address } from 'viem';

import { MAX_UINT256, useUpdateERC20Allowance } from '../hooks/useUpdateERC20Allowance';

// Component for approving ERC20 tokens
type ERC20ApproveButtonProps = {
  onSuccess: () => void;
  amount?: bigint; // Optional amount input
  spender: Address;
  chainId: number;
  erc20Address: Address;
  decimals?: number;
};

export function ERC20ApproveButton({
  onSuccess,
  amount,
  chainId,
  erc20Address,
  spender,
  // Default to decimals for USDC
  decimals = 6
}: ERC20ApproveButtonProps) {
  const [useUnlimited, setUseUnlimited] = useState(false);

  const { triggerApproveSpender, isApprovingSpender } = useUpdateERC20Allowance({ chainId, erc20Address, spender });

  async function approveSpender() {
    await triggerApproveSpender({ amount: useUnlimited || !amount ? MAX_UINT256 : amount });
    onSuccess();
  }

  const displayAmount = useUnlimited ? 'Unlimited' : (Number(amount || 0) / 10 ** decimals).toFixed(2);

  return (
    <div>
      <Stack>
        {amount && (
          <FormControlLabel
            control={
              <Checkbox checked={useUnlimited} onChange={() => setUseUnlimited(!useUnlimited)} color='primary' />
            }
            label='Approve Unlimited'
          />
        )}
        <Button variant='contained' color='primary' onClick={approveSpender} disabled={isApprovingSpender}>
          {isApprovingSpender ? 'Approving...' : `Approve ${displayAmount} USDC`}
        </Button>
      </Stack>
    </div>
  );
}
