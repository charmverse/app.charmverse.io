import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { Launch as LaunchIcon } from '@mui/icons-material';
import { Alert, Box, Divider, Link, Stack, TextField, Typography } from '@mui/material';
import { charmVerseBankAddress, uniswapSwapUrl } from '@packages/subscriptions/constants';
import { getExpiresAt } from '@packages/subscriptions/getExpiresAt';
import { shortenHex } from '@packages/utils/blockchain';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { Button } from 'components/common/Button';
import ErrorBoundary from 'components/common/errors/ErrorBoundary';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDecentV4Transaction } from '../hooks/useDecentV4Transaction';
import { useDevTokenBalance } from '../hooks/useDevTokenBalance';
import { useGetERC20Allowance } from '../hooks/useGetERC20Allowance';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';
import { useSpaceSubscriptionTransaction } from '../hooks/useSpaceSubscriptionTransaction';

import { ERC20ApproveButton } from './ERC20Approve';
import type { SelectedPaymentOption } from './PaymentTokenSelector';
import { DEV_PAYMENT_OPTION, PaymentTokenSelector, TOKEN_LOGO_RECORD } from './PaymentTokenSelector';

export function SendDevToSpaceForm({
  spaceTokenBalance,
  monthlyPrice,
  spaceTier,
  isOpen,
  onClose,
  onSuccess,
  spaceId,
  spaceName
}: {
  spaceTokenBalance: number;
  monthlyPrice?: number;
  spaceTier: SpaceSubscriptionTier | null;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  spaceId: string;
  spaceName: string;
}) {
  const [amount, setAmount] = useState(0);
  const { address, chainId } = useAccount();
  const { showMessage } = useSnackbar();
  const { balance, formattedBalance, isLoading: isBalanceLoading } = useDevTokenBalance({ address });
  const { switchChainAsync } = useSwitchChain();
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    ...DEV_PAYMENT_OPTION
  });

  const { tokens } = useGetTokenBalances({
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

  const newExpiresAt = getExpiresAt({
    tier: spaceTier,
    spaceTokenBalance: spaceTokenBalance + amount,
    tierPrice: monthlyPrice
  });

  const { decentSdkError, decentTransactionInfo } = useDecentV4Transaction({
    address: address as Address,
    receiverAddress: charmVerseBankAddress,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    enabled: !!(selectedPaymentOption.currency !== 'DEV' && selectedTokenBalance),
    amount: parseUnits(amount.toString(), 18)
  });

  const tokenPaymentValue =
    decentTransactionInfo && 'tokenPayment' in decentTransactionInfo
      ? BigInt((decentTransactionInfo.tokenPayment?.amount?.toString() ?? '0').replace('n', ''))
      : BigInt(0);

  const exchangeRate =
    amount !== 0 ? Number(formatUnits(tokenPaymentValue, selectedPaymentOption.decimals)) / amount : 0;

  const paymentOptionBidAmount = useMemo(() => {
    if (selectedPaymentOption.currency === 'DEV') {
      return amount;
    }

    if (exchangeRate) {
      return amount * exchangeRate;
    }

    return null;
  }, [amount, selectedPaymentOption, exchangeRate]);

  const selectedChainCurrency = selectedPaymentOption.address;

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address:
      selectedPaymentOption.currency === 'USDC' || selectedPaymentOption.currency === 'DEV'
        ? selectedChainCurrency
        : null,
    owner: address as Address,
    spender: decentTransactionInfo && 'tx' in decentTransactionInfo ? (decentTransactionInfo.tx.to as Address) : null
  });

  const amountToApprove =
    selectedPaymentOption.currency === 'DEV'
      ? BigInt(parseUnits(amount.toString(), selectedPaymentOption.decimals))
      : paymentOptionBidAmount
        ? BigInt(parseUnits(paymentOptionBidAmount.toString(), selectedPaymentOption.decimals))
        : BigInt(0);

  const approvalRequired =
    selectedPaymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToApprove === 'bigint' ? amountToApprove : BigInt(0));

  const { sendDevTransaction, sendOtherTokenTransaction } = useSpaceSubscriptionTransaction();

  async function onDevTransfer() {
    log.info('User selected to send DEV to space', {
      spaceId,
      amount,
      fromAddress: address as Address
    });
    setIsProcessing(true);
    try {
      if (selectedPaymentOption.currency === 'DEV') {
        await sendDevTransaction({
          spaceId,
          amount,
          fromAddress: address as Address
        });
        onSuccess();
        onClose();
      } else if (decentTransactionInfo && 'tx' in decentTransactionInfo) {
        if (selectedPaymentOption.chainId !== chainId) {
          try {
            await switchChainAsync({ chainId: selectedPaymentOption.chainId });
          } catch (error) {
            showMessage('Failed to switch chain', 'error');
            return;
          }
        }

        await sendOtherTokenTransaction({
          txData: {
            to: decentTransactionInfo.tx.to as Address,
            data: decentTransactionInfo.tx.data as `0x${string}`,
            value: BigInt((decentTransactionInfo.tx as EvmTransaction).value?.toString().replace('n', '') || '0')
          },
          txMetadata: {
            fromAddress: address as Address,
            decentChainId: selectedPaymentOption.chainId,
            spaceId,
            amount
          }
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      showMessage('Failed to process payment. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  if (!address) {
    return (
      <Modal open={isOpen} onClose={onClose}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant='h6'>Connect Wallet</Typography>
          <Typography>Please connect your wallet to continue.</Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <ErrorBoundary>
      <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
        <Modal open={isOpen} onClose={onClose}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='h6'>Send DEV to {spaceName}</Typography>
            <Typography>Your contribution will be used to pay for the subscription.</Typography>
            <Divider />
            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Connected wallet: {shortenHex(address, 4)}
              </Typography>
              <Stack flexDirection='row' alignItems='center' justifyContent='space-between'>
                <Stack flexDirection='row' alignItems='center' gap={0.5}>
                  <Typography variant='body2'>
                    Your balance: <b>{formattedBalance.toLocaleString()}</b>
                  </Typography>
                  <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
                </Stack>
                <Typography component={Link} variant='caption' href={uniswapSwapUrl} target='_blank'>
                  Buy DEV on Uniswap
                  <LaunchIcon fontSize='inherit' />
                </Typography>
              </Stack>
            </Box>
            <PaymentTokenSelector
              selectedPaymentOption={selectedPaymentOption}
              onSelectPaymentOption={(option) => {
                setAmount(0);
                setSelectedPaymentOption(option);
              }}
              selectedTokenBalance={selectedTokenBalance}
              disabled={isProcessing}
              tokensWithBalances={tokens}
            />
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
                New expiration at {monthlyPrice} DEV/mo:{' '}
                <strong>
                  {newExpiresAt
                    ? newExpiresAt.toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' })
                    : 'N/A'}
                </strong>
              </Typography>
            </Stack>
            {decentSdkError?.error && (
              <Typography variant='caption' color='error' align='center'>
                {decentSdkError.error.message?.includes('route')
                  ? `Could not find a route between DEV and ${selectedPaymentOption.currency}. Please try a different payment option.`
                  : 'There was an error communicating with Decent API'}
              </Typography>
            )}
            {selectedPaymentOption.currency !== 'DEV' && paymentOptionBidAmount ? (
              <Stack gap={0.5} alignItems='center' flexDirection='row'>
                <Typography variant='caption' align='center'>
                  ≈ {paymentOptionBidAmount} {selectedPaymentOption.currency}
                </Typography>
                <Image
                  src={TOKEN_LOGO_RECORD[selectedPaymentOption.currency]}
                  alt={selectedPaymentOption.currency}
                  width={14}
                  height={14}
                />
              </Stack>
            ) : null}
            {!approvalRequired || isProcessing ? (
              <Stack flexDirection='row' justifyContent='flex-end'>
                <Button
                  loading={isProcessing}
                  variant='contained'
                  onClick={onDevTransfer}
                  sx={{ width: 'fit-content' }}
                  disabled={
                    amount === 0 ||
                    balance < amount ||
                    isBalanceLoading ||
                    (selectedPaymentOption.currency !== 'DEV' && exchangeRate === 0)
                  }
                >
                  Send
                </Button>
              </Stack>
            ) : decentTransactionInfo && 'tx' in decentTransactionInfo ? (
              <ERC20ApproveButton
                spender={decentTransactionInfo?.tx.to as Address}
                chainId={selectedPaymentOption.chainId}
                erc20Address={selectedPaymentOption.address}
                amount={amountToApprove}
                onSuccess={refreshAllowance}
                decimals={selectedPaymentOption.decimals}
                currency={selectedPaymentOption.currency}
                actionType='purchase'
                color='primary'
              />
            ) : null}
          </Box>
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              Please do not close your browser while the transaction is processing. It may take a few minutes to
              complete.
            </Typography>
          </Alert>
        </Modal>
      </BoxHooksContextProvider>
    </ErrorBoundary>
  );
}
