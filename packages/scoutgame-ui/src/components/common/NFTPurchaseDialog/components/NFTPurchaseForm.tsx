'use client';

import env from '@beam-australia/react-env';
import { ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider } from '@decent.xyz/box-hooks';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { BuilderNFTSeasonOneImplementation01Client } from '@packages/scoutgame/builderNfts/clients/builderNFTSeasonOneClient';
import {
  builderNftChain,
  getBuilderContractAddress,
  treasuryAddress,
  useTestnets
} from '@packages/scoutgame/builderNfts/constants';
import { purchaseWithPointsAction } from '@packages/scoutgame/builderNfts/purchaseWithPointsAction';
import { convertCostToPoints } from '@packages/scoutgame/builderNfts/utils';
import { scoutgameMintsLogger } from '@packages/scoutgame/loggers/mintsLogger';
import type { MinimalUserInfo } from '@packages/scoutgame/users/interfaces';
import { isTestEnv } from '@packages/utils/constants';
import Image from 'next/image';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';

import { useUserWalletAddress } from '../../../../hooks/api/session';
import { usePurchase } from '../../../../providers/PurchaseProvider';
import { useSnackbar } from '../../../../providers/SnackbarContext';
import { useUser } from '../../../../providers/UserProvider';
import { IconButton } from '../../Button/IconButton';
import { PointsIcon } from '../../Icons';
import { useDecentTransaction } from '../hooks/useDecentTransaction';
import { useGetBuilderStrikesCount } from '../hooks/useGetBuilderStrikesCount';
import { useGetERC20Allowance } from '../hooks/useGetERC20Allowance';
import { useGetTokenBalances } from '../hooks/useGetTokenBalances';

import { getCurrencyContract } from './ChainSelector/chains';
import type { SelectedPaymentOption } from './ChainSelector/ChainSelector';
import { BlockchainSelect } from './ChainSelector/ChainSelector';
import { ERC20ApproveButton } from './ERC20Approve';
import { NumberInputField } from './NumberField';
import { SuccessView } from './SuccessView';

export type NFTPurchaseProps = {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};

const PRICE_POLLING_INTERVAL = 60000;

export function NFTPurchaseForm(props: NFTPurchaseProps) {
  // Waiting for component to render before fetching the API key
  const apiKey = env('DECENT_API_KEY');

  if (!apiKey && !isTestEnv) {
    return <Typography color='error'>Decent API key not found</Typography>;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey || '1234'}>
      <NFTPurchaseFormContent {...props} />
    </BoxHooksContextProvider>
  );
}

export function NFTPurchaseFormContent({ builder }: NFTPurchaseProps) {
  const { user, refreshUser } = useUser();
  const builderId = builder.id;
  const initialQuantities = [1, 11, 111];
  const pricePerNft = builder.price ? convertCostToPoints(builder.price).toLocaleString() : '';
  const { address, chainId } = useAccount();
  const { error: addressError } = useUserWalletAddress(address);
  const { isExecutingTransaction, sendNftMintTransaction, isSavingDecentTransaction, purchaseSuccess, purchaseError } =
    usePurchase();
  const { showMessage } = useSnackbar();

  const { switchChainAsync } = useSwitchChain();
  const { data: builderStrikesCount } = useGetBuilderStrikesCount({ builderId });

  const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress: getBuilderContractAddress(),
    publicClient: getPublicClient(builderNftChain.id)
  });

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: useTestnets ? ChainId.OPTIMISM_SEPOLIA : ChainId.OPTIMISM,
    currency: 'ETH'
  });

  const { tokens: userTokenBalances } = useGetTokenBalances({ address: address as Address });

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (purchaseError) {
      setSubmitError(purchaseError);
    }
  }, [purchaseError]);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState<'points' | 'wallet'>('wallet');

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const purchaseCostInPoints = convertCostToPoints(purchaseCost);
  const notEnoughPoints = user && user.currentBalance < purchaseCostInPoints;

  const {
    isExecuting: isExecutingPointsPurchase,
    hasSucceeded: hasPurchasedWithPoints,
    executeAsync: purchaseWithPoints
  } = useAction(purchaseWithPointsAction, {
    onError({ error, input }) {
      scoutgameMintsLogger.error('Error purchasing with points', { input, error, userId: user?.id });
      setSubmitError(error.serverError?.message || 'Something went wrong');
    },
    onExecute() {
      setSubmitError(null);
    }
  });

  const refreshAsk = useCallback(
    async ({ _builderTokenId, amount }: { _builderTokenId: bigint | number; amount: bigint | number }) => {
      const _price = await builderContractReadonlyApiClient.getTokenPurchasePrice({
        args: { amount: BigInt(amount), tokenId: BigInt(_builderTokenId) }
      });
      setPurchaseCost(_price);
    },
    [setPurchaseCost]
  );

  async function refreshTokenData() {
    setFetchError(null);
    let _builderTokenId: bigint | undefined;
    try {
      setIsFetchingPrice(true);
      _builderTokenId = await builderContractReadonlyApiClient.getTokenIdForBuilder({ args: { builderId } });

      setBuilderTokenId(_builderTokenId);

      await refreshAsk({ _builderTokenId, amount: tokensToBuy });

      setIsFetchingPrice(false);
    } catch (error) {
      scoutgameMintsLogger.warn('Error fetching token data', {
        error,
        builderId,
        tokenId: _builderTokenId,
        userId: user?.id
      });
      setIsFetchingPrice(false);
      setFetchError(error);
    }
  }

  useEffect(() => {
    if (builderId) {
      refreshTokenData();
    }
  }, [builderId]);

  useEffect(() => {
    if (tokensToBuy && builderTokenId) {
      refreshAsk({ _builderTokenId: builderTokenId, amount: tokensToBuy });
    }
  }, [tokensToBuy, builderTokenId, refreshAsk]);

  useEffect(() => {
    if (!builderId || isExecutingTransaction || isExecutingPointsPurchase || isSavingDecentTransaction) {
      return;
    }

    refreshTokenData();

    const interval = setInterval(refreshTokenData, PRICE_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [builderId, tokensToBuy, isExecutingTransaction, isExecutingPointsPurchase, isSavingDecentTransaction]);

  const enableNftButton = !!address && !!purchaseCost && !!user;

  const { decentSdkError, isLoadingDecentSdk, decentTransactionInfo } = useDecentTransaction({
    address: address as Address,
    builderTokenId,
    scoutId: user?.id as string,
    paymentAmountOut: purchaseCost,
    sourceChainId: selectedPaymentOption.chainId,
    sourceToken: getCurrencyContract(selectedPaymentOption),
    tokensToPurchase: BigInt(tokensToBuy)
  });

  const selectedChainCurrency = getCurrencyContract(selectedPaymentOption) as Address;

  const { allowance, refreshAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address: selectedPaymentOption.currency === 'USDC' ? selectedChainCurrency : null,
    owner: address as Address,
    spender: decentTransactionInfo?.tx.to as Address
  });

  const balanceInfo = userTokenBalances?.find(
    (_token) => _token.chainId === selectedPaymentOption.chainId && _token.address === selectedChainCurrency
  );

  const amountToPay = BigInt(decentTransactionInfo?.tokenPayment?.amount?.toString().replace('n', '') || 0);

  const hasInsufficientBalance = !!amountToPay && !!balanceInfo && balanceInfo.balance < amountToPay;

  const handlePurchase = async () => {
    if (paymentMethod === 'points') {
      await purchaseWithPoints({
        builderId: builder.id,
        recipientAddress: address as `0x${string}`,
        amount: tokensToBuy
      });
      await refreshUser();
    } else {
      if (!decentTransactionInfo?.tx) {
        return;
      }

      if (chainId !== selectedPaymentOption.chainId) {
        await switchChainAsync(
          { chainId: selectedPaymentOption.chainId },
          {
            onError() {
              showMessage('Failed to switch chain');
            }
          }
        );
      }

      const _value = BigInt(String((decentTransactionInfo.tx as any).value || 0).replace('n', ''));
      setSubmitError(null);

      sendNftMintTransaction({
        txData: {
          to: decentTransactionInfo.tx.to as Address,
          data: decentTransactionInfo.tx.data as any,
          value: _value
        },
        txMetadata: {
          fromAddress: address as Address,
          sourceChainId: selectedPaymentOption.chainId,
          builderTokenId: Number(builderTokenId),
          builderId: builder.id,
          purchaseCost: Number(purchaseCost),
          tokensToBuy
        }
      }).catch((error) => {
        setSubmitError(
          typeof error === 'string'
            ? 'Error'
            : error.message || 'Something went wrong. Check your wallet is connected and has a sufficient balance'
        );
      });
    }
  };

  const isLoading =
    isSavingDecentTransaction ||
    isLoadingDecentSdk ||
    isFetchingPrice ||
    isExecutingTransaction ||
    isExecutingPointsPurchase;

  const displayedBalance = !balanceInfo
    ? undefined
    : selectedPaymentOption.currency === 'ETH'
      ? (Number(balanceInfo.balance || 0) / 1e18).toFixed(4)
      : (Number(balanceInfo.balance || 0) / 1e6).toFixed(2);

  const [selectedQuantity, setSelectedQuantity] = useState<number | 'custom'>(1);
  const [customQuantity, setCustomQuantity] = useState(2);

  const handleTokensToBuyChange = (value: number | 'custom') => {
    if (value === 'custom') {
      setSelectedQuantity('custom');
      setTokensToBuy(customQuantity);
    } else if (value) {
      setSelectedQuantity(value);
      setTokensToBuy(value);
    }
  };
  const approvalRequired =
    paymentMethod === 'wallet' &&
    selectedPaymentOption.currency === 'USDC' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToPay === 'bigint' ? amountToPay : BigInt(0));

  if (hasPurchasedWithPoints || purchaseSuccess) {
    return <SuccessView builder={builder} />;
  }

  return (
    <Stack gap={3} width='400px' maxWidth='100%' mx='auto'>
      <Box
        bgcolor='black.dark'
        width='100%'
        pt={2}
        pb={1}
        display='flex'
        alignItems='center'
        flexDirection='column'
        gap={1}
      >
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.path}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '40%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
        <Typography textAlign='center' fontWeight={600} color='secondary'>
          <>
            {pricePerNft}{' '}
            <Box component='span' display='inline' position='relative' top={4}>
              <PointsIcon color='blue' size={18} />
            </Box>
          </>
        </Typography>
      </Box>
      {builderStrikesCount ? (
        <Alert severity='warning'>
          This builder has {builderStrikesCount} strike{builderStrikesCount > 1 ? 's' : ''}. Click{' '}
          <Link href='/info/spam-policy' target='_blank'>
            here
          </Link>{' '}
          to learn more.
        </Alert>
      ) : null}
      <Stack gap={1}>
        <Typography color='secondary'>Select quantity</Typography>
        <ToggleButtonGroup
          value={selectedQuantity}
          onChange={(_, newValue) => handleTokensToBuyChange(newValue)}
          exclusive
          fullWidth
          aria-label='quantity selection'
        >
          {initialQuantities.map((q) => (
            <ToggleButton sx={{ minWidth: 60, minHeight: 40 }} key={q} value={q} aria-label={q.toString()}>
              {q}
            </ToggleButton>
          ))}
          <ToggleButton sx={{ fontSize: 14, textTransform: 'none' }} value='custom' aria-label='custom'>
            Custom
          </ToggleButton>
        </ToggleButtonGroup>
        {selectedQuantity === 'custom' && (
          <Stack flexDirection='row' gap={2} mt={2}>
            <IconButton
              color='secondary'
              onClick={() => {
                const newQuantity = Math.max(1, customQuantity - 1);
                setCustomQuantity(newQuantity);
                setTokensToBuy(newQuantity);
              }}
            >
              -
            </IconButton>
            <NumberInputField
              fullWidth
              color='secondary'
              id='builderId'
              type='number'
              placeholder='Quantity'
              value={customQuantity}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!Number.isNaN(value) && value > 0) {
                  setCustomQuantity(value);
                  setTokensToBuy(value);
                }
              }}
              disableArrows
              sx={{ '& input': { textAlign: 'center' } }}
            />
            <IconButton
              color='secondary'
              onClick={() => {
                setCustomQuantity((prev) => prev + 1);
                setTokensToBuy((prev) => prev + 1);
              }}
            >
              +
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Stack>
        <Stack flexDirection='row' alignItems='center' gap={0.5} mb={1}>
          <Typography color='secondary'>Total cost</Typography>
          <Link href='/info#builder-nfts' target='_blank' title='Read how Builder cards are priced'>
            <InfoIcon sx={{ color: 'secondary.main', fontSize: 16, opacity: 0.7 }} />
          </Link>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
          <Typography variant='caption' color='secondary' align='left' sx={{ width: '50%' }}>
            Qty
          </Typography>
          <Typography variant='caption' color='secondary' align='left' flexGrow={1}>
            Points
          </Typography>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography sx={{ width: '50%' }}>{tokensToBuy} Card</Typography>
          <Typography align='left' flexGrow={1}>
            {purchaseCost && (
              <>
                {purchaseCostInPoints.toLocaleString()}{' '}
                <Box component='span' display='inline' position='relative' top={4}>
                  <PointsIcon size={18} />
                </Box>
              </>
            )}
            {isFetchingPrice && <CircularProgress size={16} />}
          </Typography>
        </Stack>
      </Stack>
      <Stack>
        <Typography color='secondary'>Select payment</Typography>
        <RadioGroup
          row
          aria-label='payment method'
          name='payment-method'
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'points' | 'wallet')}
          sx={{ mb: 1, display: 'flex', gap: 2, width: '100%' }}
        >
          <FormControlLabel sx={{ width: '50%', mr: 0 }} value='wallet' control={<Radio />} label='Wallet' />
          <FormControlLabel
            value='points'
            // disabled={Boolean(loadingUser || notEnoughPoints)}
            control={<Radio />}
            label={
              <Stack direction='row' alignItems='center' spacing={0.5}>
                <Typography>Scout Points</Typography>
              </Stack>
            }
          />
        </RadioGroup>
        {paymentMethod === 'points' ? (
          <Stack gap={1}>
            <Paper
              sx={{
                backgroundColor: 'background.light',
                borderColor: notEnoughPoints ? 'var(--mui-palette-error-main)' : undefined,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
              variant='outlined'
            >
              <PointsIcon size={24} />
              {user && (
                <>
                  <Typography color={notEnoughPoints ? 'error' : undefined}>Balance: {user?.currentBalance}</Typography>

                  {notEnoughPoints && (
                    <Typography flexGrow={1} variant='caption' color='error' align='right'>
                      Not enough Points
                    </Typography>
                  )}
                </>
              )}
            </Paper>
          </Stack>
        ) : (
          <>
            <BlockchainSelect
              value={selectedPaymentOption}
              balance={displayedBalance}
              useTestnets={useTestnets}
              address={address}
              onSelectChain={(_paymentOption) => {
                setSelectedPaymentOption(_paymentOption);
              }}
            />
            {hasInsufficientBalance ? (
              <Typography sx={{ mt: 1 }} variant='caption' color='error' align='center'>
                Insufficient balance
              </Typography>
            ) : null}
          </>
        )}
      </Stack>
      {fetchError && (
        <Typography variant='caption' color='error'>
          {fetchError.shortMessage || 'Something went wrong'}
        </Typography>
      )}

      {!approvalRequired || isExecutingTransaction || isExecutingPointsPurchase || isFetchingPrice ? (
        <LoadingButton
          loading={isLoading}
          size='large'
          onClick={handlePurchase}
          variant='contained'
          disabled={
            !enableNftButton ||
            isLoadingDecentSdk ||
            isFetchingPrice ||
            !treasuryAddress ||
            isSavingDecentTransaction ||
            isExecutingTransaction ||
            (paymentMethod === 'points' && notEnoughPoints) ||
            isExecutingPointsPurchase ||
            addressError
          }
          data-test='purchase-button'
        >
          {isFetchingPrice ? 'Updating Price...' : 'Buy'}
        </LoadingButton>
      ) : (
        <ERC20ApproveButton
          spender={decentTransactionInfo?.tx.to as Address}
          chainId={selectedPaymentOption.chainId}
          erc20Address={getCurrencyContract(selectedPaymentOption) as Address}
          amount={amountToPay}
          onSuccess={() => refreshAllowance()}
        />
      )}
      {decentSdkError instanceof Error ? (
        <Typography variant='caption' color='error' align='center'>
          There was an error communicating with Decent API
        </Typography>
      ) : null}
      {addressError && (
        <Typography variant='caption' color='error' align='center'>
          {`Address ${address} is already in use. Please connect a different wallet`}
        </Typography>
      )}
      {submitError && (
        <Typography variant='caption' color='error' align='center'>
          {submitError}
        </Typography>
      )}
    </Stack>
  );
}
