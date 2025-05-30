import env from '@beam-australia/react-env';
import type { SpaceSubscriptionTier } from '@charmverse/core/prisma';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { Launch as LaunchIcon } from '@mui/icons-material';
import { Alert, Box, capitalize, Card, Divider, Link, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { calculateSubscriptionCost } from '@packages/subscriptions/calculateSubscriptionCost';
import type { UpgradableTier } from '@packages/subscriptions/constants';
import { charmVerseBankAddress, uniswapSwapUrl } from '@packages/subscriptions/constants';
import { shortenHex } from '@packages/utils/blockchain';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits, parseUnits } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useSnackbar } from 'hooks/useSnackbar';

import { useDecentV4Transaction } from '../../hooks/useDecentV4Transaction';
import { useDevTokenBalance } from '../../hooks/useDevTokenBalance';
import { useGetERC20Allowance } from '../../hooks/useGetERC20Allowance';
import { useGetTokenBalances } from '../../hooks/useGetTokenBalances';
import { useSpaceSubscriptionTransaction } from '../../hooks/useSpaceSubscriptionTransaction';
import { ERC20ApproveButton } from '../ERC20Approve';
import type { SelectedPaymentOption } from '../PaymentTokenSelector';
import { DEV_PAYMENT_OPTION, PaymentTokenSelector, TOKEN_LOGO_RECORD } from '../PaymentTokenSelector';

export function UpgradeSubscriptionModal({
  spaceId,
  isOpen,
  onClose: _onClose,
  onSuccess,
  currentTier,
  newTier
}: {
  spaceId: string;
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
  currentTier: SpaceSubscriptionTier | null;
  newTier: UpgradableTier;
}) {
  const [paymentPeriod, setPaymentPeriod] = useState<'month' | 'year' | 'custom'>('month');
  const [paymentMonths, setPaymentMonths] = useState<number>(1);
  const { showMessage } = useSnackbar();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isProcessing, setIsProcessing] = useState(false);
  const { formattedBalance, isLoading: isBalanceLoading } = useDevTokenBalance({ address });

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

  const { newTierPrice, amountToProrate, priceForMonths, devTokensToSend } = calculateSubscriptionCost({
    currentTier,
    newTier,
    paymentMonths
  });

  function onClose() {
    _onClose();
    setPaymentPeriod('month');
    setPaymentMonths(1);
  }

  const isLoading = isProcessing || isBalanceLoading;

  const { decentSdkError, decentTransactionInfo } = useDecentV4Transaction({
    address: address as Address,
    receiverAddress: charmVerseBankAddress,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: selectedPaymentOption.address,
    enabled: !!(selectedPaymentOption.currency !== 'DEV' && selectedTokenBalance),
    amount: parseUnits(devTokensToSend.toString(), 18)
  });

  const tokenPaymentValue =
    decentTransactionInfo && 'tokenPayment' in decentTransactionInfo
      ? BigInt((decentTransactionInfo.tokenPayment?.amount?.toString() ?? '0').replace('n', ''))
      : BigInt(0);

  const exchangeRate =
    devTokensToSend !== 0
      ? Number(formatUnits(tokenPaymentValue, selectedPaymentOption.decimals)) / devTokensToSend
      : 0;

  const paymentOptionBidAmount = useMemo(() => {
    if (selectedPaymentOption.currency === 'DEV') {
      return devTokensToSend;
    }

    if (exchangeRate) {
      return devTokensToSend * exchangeRate;
    }

    return null;
  }, [devTokensToSend, selectedPaymentOption, exchangeRate]);

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
      ? BigInt(parseUnits(devTokensToSend.toString(), selectedPaymentOption.decimals))
      : paymentOptionBidAmount
        ? BigInt(parseUnits(paymentOptionBidAmount.toString(), selectedPaymentOption.decimals))
        : BigInt(0);

  const approvalRequired =
    selectedPaymentOption.currency !== 'ETH' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToApprove === 'bigint' ? amountToApprove : BigInt(0));

  const { sendDevTransaction, sendOtherTokenTransaction } = useSpaceSubscriptionTransaction();

  async function onUpgrade() {
    setIsProcessing(true);

    try {
      if (selectedPaymentOption.currency === 'DEV') {
        if (devTokensToSend > 0) {
          await sendDevTransaction({
            spaceId,
            amount: devTokensToSend,
            fromAddress: address as Address
          });
          await charmClient.subscription.upgradeSubscription(spaceId, {
            tier: newTier,
            paymentMonths
          });
        }
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
            amount: devTokensToSend
          }
        });

        await charmClient.subscription.upgradeSubscription(spaceId, {
          tier: newTier,
          paymentMonths
        });
      }

      showMessage('Space subscription upgraded successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showMessage('Failed to upgrade space subscription. Please try again later.', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <BoxHooksContextProvider apiKey={env('DECENT_API_KEY')}>
      <Modal open={isOpen} onClose={onClose}>
        <Stack gap={2}>
          <Typography variant='h6'>
            Switch to <strong>{capitalize(newTier)}</strong>
          </Typography>
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
          <Divider />
          <Stack gap={1}>
            <Typography variant='subtitle2'>Select a period</Typography>
            <Stack direction='row' spacing={1}>
              <Button
                disabled={isLoading}
                sx={{ flex: 1 }}
                variant={paymentPeriod === 'month' ? 'contained' : 'outlined'}
                onClick={() => {
                  setPaymentPeriod('month');
                  setPaymentMonths(1);
                }}
              >
                1 month
              </Button>
              <Button
                disabled={isLoading}
                sx={{ flex: 1 }}
                variant={paymentPeriod === 'year' ? 'contained' : 'outlined'}
                onClick={() => {
                  setPaymentPeriod('year');
                  setPaymentMonths(12);
                }}
              >
                1 year
              </Button>
              <Button
                disabled={isLoading}
                sx={{ flex: 1 }}
                variant={paymentPeriod === 'custom' ? 'contained' : 'outlined'}
                onClick={() => {
                  setPaymentPeriod('custom');
                  setPaymentMonths(4);
                }}
              >
                Custom
              </Button>
            </Stack>
            {paymentPeriod === 'custom' && (
              <Stack my={1}>
                <Typography variant='body2' color='text.secondary'>
                  Months
                </Typography>
                <TextField
                  disabled={isLoading}
                  variant='outlined'
                  type='number'
                  value={paymentMonths}
                  inputProps={{ min: 1, max: 12 }}
                  onChange={(e) => setPaymentMonths(Number(e.target.value))}
                  sx={{ mt: 1 }}
                />
              </Stack>
            )}
          </Stack>
          <PaymentTokenSelector
            selectedPaymentOption={selectedPaymentOption}
            onSelectPaymentOption={(option) => {
              setSelectedPaymentOption(option);
            }}
            selectedTokenBalance={selectedTokenBalance}
            disabled={isProcessing}
            tokensWithBalances={tokens}
          />
          <Card variant='outlined' sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Stack gap={1}>
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='body2'>
                  {paymentMonths} months x {newTierPrice}
                </Typography>
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <Typography variant='body2'>{priceForMonths}</Typography>
                  <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
                </Stack>
              </Stack>
              {amountToProrate ? (
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Prorated discount</Typography>
                  <Stack direction='row' alignItems='center' gap={0.5}>
                    <Typography variant='body2'>- {amountToProrate}</Typography>
                    <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
                  </Stack>
                </Stack>
              ) : null}
              <Divider />
              <Stack direction='row' justifyContent='space-between'>
                <Typography variant='subtitle2' fontWeight={600}>
                  Total payment
                </Typography>
                <Stack direction='row' alignItems='center' gap={0.5}>
                  <Typography variant='subtitle2' fontWeight={600}>
                    {devTokensToSend}
                  </Typography>
                  <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
                </Stack>
              </Stack>
              {selectedPaymentOption.currency !== 'DEV' && paymentOptionBidAmount ? (
                <Stack direction='row' justifyContent='flex-end' alignItems='center' gap={0.5}>
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
            </Stack>
          </Card>
          {decentSdkError?.error && (
            <Typography variant='caption' color='error' align='center'>
              {decentSdkError.error.message?.includes('route')
                ? `Could not find a route between DEV and ${selectedPaymentOption.currency}. Please try a different payment option.`
                : 'There was an error communicating with Decent API'}
            </Typography>
          )}
          {formattedBalance < devTokensToSend && selectedPaymentOption.currency === 'DEV' && (
            <Typography variant='body2' color='error'>
              You do not have enough DEV tokens.
            </Typography>
          )}
          <Stack direction='row' spacing={2} justifyContent='flex-end'>
            {!approvalRequired || isProcessing ? (
              <>
                <Button variant='outlined' onClick={onClose} color='secondary' disabled={isLoading}>
                  Cancel
                </Button>
                <Tooltip title={!paymentPeriod ? 'Select a period' : ''}>
                  <span>
                    <Button
                      variant='contained'
                      disabled={
                        paymentMonths === 0 ||
                        !paymentPeriod ||
                        (selectedPaymentOption.currency === 'DEV' && formattedBalance < devTokensToSend) ||
                        (selectedPaymentOption.currency !== 'DEV' && exchangeRate === 0)
                      }
                      loading={isLoading}
                      onClick={onUpgrade}
                    >
                      Upgrade
                    </Button>
                  </span>
                </Tooltip>
              </>
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
          </Stack>
        </Stack>
        <Alert severity='warning' sx={{ mt: 2 }}>
          <Typography variant='body2'>
            Please do not close your browser while the transaction is processing. It may take a few minutes to complete.
          </Typography>
        </Alert>
      </Modal>
    </BoxHooksContextProvider>
  );
}
