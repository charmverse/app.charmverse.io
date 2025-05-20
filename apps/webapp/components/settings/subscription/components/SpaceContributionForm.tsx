import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Image from 'next/image';
import { useState } from 'react';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDevTokenBalance } from '../hooks/useDevTokenBalance';
import { useTransferDevToken } from '../hooks/useTransferDevToken';

export function SpaceContributionForm({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const [amount, setAmount] = useState(0);
  const { address } = useAccount();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { balance, formattedBalance, isLoading: isBalanceLoading } = useDevTokenBalance({ address });

  const { isTransferring, transferDevToken } = useTransferDevToken();

  async function onDevTransfer() {
    const result = await transferDevToken(amount);
    if (result && space) {
      await charmClient.subscription
        .recordSubscriptionContribution(space.id, {
          hash: result.hash,
          walletAddress: result.address,
          paidTokenAmount: result.transferredAmount.toString(),
          signature: result.signature,
          message: result.message
        })
        .catch((err) => {
          showMessage(err?.message ?? 'The transfer of DEV tokens could not be made. Please try again later.', 'error');
        })
        .then(() => {
          showMessage('DEV tokens sent successfully', 'success');
          onSuccess();
          onClose();
        });
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Send DEV</Typography>
        <Stack gap={1}>
          <TextField
            fullWidth
            type='number'
            value={amount}
            inputProps={{
              min: 1,
              max: balance
            }}
            disabled={!address || isBalanceLoading}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <Typography variant='body2' color='text.secondary'>
              Balance: {formattedBalance}
            </Typography>
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
          </Stack>
        </Stack>
        <Button
          loading={isTransferring || isBalanceLoading}
          variant='contained'
          onClick={onDevTransfer}
          sx={{ width: 'fit-content' }}
          disabled={amount === 0 || balance < amount}
        >
          Send
        </Button>
      </Box>
    </Modal>
  );
}
