import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { Launch as LaunchIcon } from '@mui/icons-material';
import { Box, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { uniswapSwapUrl } from '@packages/subscriptions/constants';
import { getExpiresAt } from '@packages/subscriptions/getExpiresAt';
import { shortenHex } from '@packages/utils/blockchain';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { formatUnits, parseUnits } from 'viem';
import type { Address } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDecentV4Transaction } from '../hooks/useDecentV4Transaction';
import { useDevTokenBalance } from '../hooks/useDevTokenBalance';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';
import { useTransferDevToken } from '../hooks/useTransferDevToken';

import { ERC20ApproveButton } from './ERC20Approve';
import { DEV_PAYMENT_OPTION } from './PaymentTokenSelector';
import type { SelectedPaymentOption } from './PaymentTokenSelector';

export function SendDevToSpaceForm({
  spaceTokenBalance,
  spaceTier,
  isOpen,
  onClose,
  onSuccess
}: {
  spaceTokenBalance: number;
  spaceTier: SpaceSubscriptionTier | null;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
  const [amount, setAmount] = useState(0);
  const { address } = useAccount();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { balance, formattedBalance, isLoading: isBalanceLoading } = useDevTokenBalance({ address });
  const { switchChainAsync } = useSwitchChain();

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    ...DEV_PAYMENT_OPTION
  });

  const { tokens, isLoading: isLoadingTokenBalances } = useGetTokenBalances({
    address: address as Address
  });

  const { selectedTokenBalance } = useMemo(() => {
    const _selectedPaymentOption = tokens?.find(
      (token) =>
        token.address.toLowerCase() === selectedPaymentOption.address.toLowerCase() &&
        token.chainId === selectedPaymentOption.chainId
    );

    return {
      selectedTokenBalance: _selectedPaymentOption?.balance
    };
  }, [tokens, selectedPaymentOption]);

  const { transferDevToken } = useTransferDevToken();
  const [isProcessing, setIsProcessing] = useState(false);

  const newExpiresAt = getExpiresAt(spaceTier, spaceTokenBalance + amount);

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentV4Transaction({
    address: address as Address,
    receiverAddress: space?.id as Address,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    enabled: !!(selectedPaymentOption.currency !== 'DEV' && selectedTokenBalance),
    amount: parseUnits(amount.toString(), 18)
  });

  const tokenPaymentValue =
    decentTransactionInfo && 'tokenPayment' in decentTransactionInfo
      ? BigInt((decentTransactionInfo.tokenPayment?.amount?.toString() ?? '0').replace('n', ''))
      : BigInt(0);

  const exchangeRate = Number(formatUnits(tokenPaymentValue, selectedPaymentOption.decimals)) / Number(amount);

  async function onDevTransfer() {
    setIsProcessing(true);
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
    setIsProcessing(false);
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant='h6'>Send DEV to {space?.name}</Typography>
        <Typography>Your contribution will be used to pay for the subscription.</Typography>
        <Divider />
        <Box>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Connected wallet: {shortenHex(address, 4)}
          </Typography>
          <Stack flexDirection='row' alignItems='center' justifyContent='space-between'>
            <Stack flexDirection='row' alignItems='center' gap={0.5}>
              <Typography variant='body2'>
                Balance: <b>{formattedBalance.toLocaleString()}</b>
              </Typography>
              <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
            </Stack>
            <Typography component={Link} variant='caption' href={uniswapSwapUrl} target='_blank'>
              Buy DEV on Uniswap
              <LaunchIcon fontSize='inherit' />
            </Typography>
          </Stack>
        </Box>
        <Stack gap={1}>
          <TextField
            fullWidth
            type='number'
            error={amount > balance}
            value={amount}
            inputProps={{
              min: 1,
              max: balance
            }}
            disabled={!address || isBalanceLoading}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Stack>
        <Stack gap={1}>
          <Typography variant='body2'>
            New expiration:{' '}
            <strong>
              {newExpiresAt ? newExpiresAt.toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
            </strong>
          </Typography>
        </Stack>
        <Stack flexDirection='row' justifyContent='flex-end'>
          <Button
            loading={isProcessing}
            variant='contained'
            onClick={onDevTransfer}
            sx={{ width: 'fit-content' }}
            disabled={amount === 0 || balance < amount || isBalanceLoading}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
