'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import type { UseBoxActionArgs } from '@decent.xyz/box-hooks';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
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
import { BuilderNFTSeasonOneImplementation01Client } from '@packages/scoutgame/builderNfts/clients/builderNFTSeasonOneClient';
import {
  builderNftChain,
  getBuilderContractAddress,
  optimismUsdcContractAddress,
  treasuryAddress,
  useTestnets
} from '@packages/scoutgame/builderNfts/constants';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { convertCostToPointsWithDiscount, convertCostToUsd } from '@packages/scoutgame/builderNfts/utils';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import Image from 'next/image';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';

import { IconButton } from 'components/common/Button/IconButton';
import { PointsIcon } from 'components/common/Icons';
import { useUser } from 'components/layout/UserProvider';
import { checkDecentTransactionAction } from 'lib/builderNFTs/checkDecentTransactionAction';
import { purchaseWithPointsAction } from 'lib/builderNFTs/purchaseWithPointsAction';
import { saveDecentTransactionAction } from 'lib/builderNFTs/saveDecentTransactionAction';
import type { MinimalUserInfo } from 'lib/users/interfaces';

import { useGetERC20Allowance } from '../hooks/useGetERC20Allowance';

import type { ChainOption } from './ChainSelector/chains';
import { getChainOptions, getCurrencyContract } from './ChainSelector/chains';
import type { SelectedPaymentOption } from './ChainSelector/ChainSelector';
import { BlockchainSelect } from './ChainSelector/ChainSelector';
import { ERC20ApproveButton } from './ERC20Approve';
import { NumberInputField } from './NumberField';
import { SuccessView } from './SuccessView';

export type NFTPurchaseProps = {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};

export function NFTPurchaseForm(props: NFTPurchaseProps) {
  // Waiting for component to render before fetching the API key
  const apiKey = env('DECENT_API_KEY');

  if (!apiKey) {
    return <Typography color='error'>Decent API key not found</Typography>;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey}>
      <NFTPurchaseFormContent {...props} />
    </BoxHooksContextProvider>
  );
}

export function NFTPurchaseFormContent({ builder }: NFTPurchaseProps) {
  const { user } = useUser();
  const builderId = builder.id;
  const initialQuantities = [1, 11, 111];
  const pricePerNft = builder.price ? convertCostToUsd(builder.price) : 'N/A';
  const { address, chainId } = useAccount();

  const { switchChainAsync } = useSwitchChain();

  const builderContractReadonlyApiClient = new BuilderNFTSeasonOneImplementation01Client({
    chain: builderNftChain,
    contractAddress: getBuilderContractAddress(),
    publicClient: getPublicClient(builderNftChain.id)
  });

  const [selectedPaymentOption, setSelectedPaymentOption] = useState<SelectedPaymentOption>({
    chainId: useTestnets ? ChainId.OPTIMISM_SEPOLIA : ChainId.OPTIMISM,
    currency: 'ETH'
  });

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState<'points' | 'wallet'>('wallet');

  const [balances, setBalances] = useState<{ usdc: bigint; eth: bigint; chainId: number; address: string } | null>(
    null
  );

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const purchaseCostInPoints = convertCostToPointsWithDiscount(purchaseCost);
  const notEnoughPoints = user && user.currentBalance < purchaseCostInPoints;

  const {
    isExecuting: isExecutingPointsPurchase,
    hasSucceeded: hasPurchasedWithPoints,
    executeAsync: purchaseWithPoints
  } = useAction(purchaseWithPointsAction, {
    onError({ error, input }) {
      log.error('Error purchasing with points', { input, error });
      setSubmitError(error.serverError?.message || 'Something went wrong');
    },
    onExecute() {
      setSubmitError(null);
    }
  });

  const {
    isExecuting: isExecutingTransaction,
    hasSucceeded: transactionHasSucceeded,
    executeAsync: checkDecentTransaction
  } = useAction(checkDecentTransactionAction, {
    onError({ error, input }) {
      log.error('Error checking Decent transaction', { error, input });
      setSubmitError(error.serverError?.message || 'Something went wrong');
    },
    onExecute() {
      setSubmitError(null);
    }
  });

  const {
    isExecuting: isSavingDecentTransaction,
    hasSucceeded: savedDecentTransaction,
    executeAsync: saveDecentTransaction
  } = useAction(saveDecentTransactionAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        await checkDecentTransaction({ pendingTransactionId: res.data.id });
        log.info('NFT minted', { chainId, builderTokenId, purchaseCost });
      }
    },
    onError({ error, input }) {
      log.error('Error minting NFT', { chainId, input, error });
      setSubmitError(error.serverError?.message || 'Something went wrong');
    },
    onExecute() {
      setSubmitError(null);
    }
  });

  const refreshBalance = useCallback(async () => {
    const chainOption = getChainOptions({ useTestnets }).find(
      (opt) => opt.id === selectedPaymentOption.chainId
    ) as ChainOption;

    const chain = chainOption?.chain;

    const _chainId = chain?.id;

    if (!_chainId) {
      return;
    }

    const client = new UsdcErc20ABIClient({
      chain,
      contractAddress: chainOption.usdcAddress as `0x${string}`,
      publicClient: getPublicClient(_chainId)
    });

    const usdcBalance = await client.balanceOf({ args: { account: address as `0x${string}` } });

    const ethBalance = await getPublicClient(_chainId).getBalance({
      address: address as `0x${string}`
    });

    const newBalances = {
      usdc: usdcBalance,
      eth: ethBalance,
      chainId: _chainId,
      address: address as `0x${string}`
    };

    setBalances(newBalances);

    return newBalances;
  }, [address, selectedPaymentOption.chainId, selectedPaymentOption.currency]);

  useEffect(() => {
    if (selectedPaymentOption) {
      refreshBalance().catch((err) => {
        log.error('Error refreshing balance', { error: err });
      });
    }
  }, [selectedPaymentOption, address]);

  const { sendTransaction } = useSendTransaction();

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
      log.warn('Error fetching token data', { error, builderId, tokenId: _builderTokenId });
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

  /** TODO - Use this payload when we resume calling the contract directly
   {
    enable: !!address && !!purchaseCost,
    actionType: ActionType.EvmFunction,
    sender: address as string,
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    slippage: 1,

    srcChainId: ChainId.BASE,
    dstChainId: ChainId.OPTIMISM,
    actionConfig: {
      chainId: ChainId.OPTIMISM,
      contractAddress: '0x7df4d9f54a5cddfef50a032451f694d6345c60af',
      cost: {
        amount: purchaseCost,
        isNative: false,
        tokenAddress: '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
      },
      signature: 'function mintBuilderNft(uint256 tokenId, uint256 amount, string calldata scout) external',
      args: [BigInt(1), BigInt(1), 'c42efe4a-b385-488e-a5ca-135ecec0f810']
    }
  }
   */

  const enableNftButton = !!address && !!purchaseCost;

  const decentAPIParams: UseBoxActionArgs = {
    enable: enableNftButton,
    sender: address as `0x${string}`,
    srcToken: getCurrencyContract(selectedPaymentOption),
    dstToken: optimismUsdcContractAddress,
    srcChainId: selectedPaymentOption.chainId,
    dstChainId: ChainId.OPTIMISM,
    slippage: 1,
    actionType: ActionType.NftMint,
    // @ts-ignore
    actionConfig: {
      chainId: ChainId.OPTIMISM,
      contractAddress: getBuilderContractAddress(),
      cost: {
        amount: purchaseCost,
        isNative: false,
        tokenAddress: optimismUsdcContractAddress
      },
      signature: 'function mint(address account, uint256 tokenId, uint256 amount, string scout)',
      args: [address, BigInt(builderTokenId), BigInt(tokensToBuy), user?.id]
    }
  };

  const { error: decentSdkError, isLoading: isLoadingDecentSdk, actionResponse } = useBoxAction(decentAPIParams);

  const { allowance, refreshAllowance, isLoadingAllowance } = useGetERC20Allowance({
    chainId: selectedPaymentOption.chainId,
    erc20Address:
      selectedPaymentOption.currency === 'USDC'
        ? (getCurrencyContract({
            chainId: selectedPaymentOption.chainId,
            currency: 'USDC'
          }) as Address)
        : null,
    owner: address as Address,
    spender: actionResponse?.tx.to as Address
  });

  const amountToPay = actionResponse?.tokenPayment?.amount;
  const isEthPayment = !!actionResponse?.tokenPayment?.isNative;
  const balanceDataFromCorrectChain = balances?.chainId === selectedPaymentOption.chainId;

  const hasSufficientBalance =
    !amountToPay || !balanceDataFromCorrectChain
      ? false
      : isEthPayment
      ? balances?.eth >= amountToPay
      : balances?.usdc >= amountToPay;

  const handlePurchase = async () => {
    if (paymentMethod === 'points') {
      await purchaseWithPoints({
        builderId: builder.id,
        recipientAddress: address as `0x${string}`,
        amount: tokensToBuy
      });
    } else {
      if (!actionResponse?.tx) {
        return;
      }

      if (chainId !== selectedPaymentOption.chainId) {
        await switchChainAsync({ chainId: selectedPaymentOption.chainId });
      }

      sendTransaction(
        {
          to: actionResponse.tx.to as Address,
          data: actionResponse.tx.data as any,
          value: (actionResponse.tx as any).value
        },
        {
          onSuccess: async (data) => {
            await saveDecentTransaction({
              user: {
                walletAddress: address as `0x${string}`
              },
              transactionInfo: {
                destinationChainId: builderNftChain.id,
                sourceChainId: selectedPaymentOption.chainId,
                sourceChainTxHash: data
              },
              purchaseInfo: {
                quotedPrice: Number(purchaseCost),
                tokenAmount: tokensToBuy,
                builderContractAddress: getBuilderContractAddress(),
                tokenId: Number(builderTokenId),
                quotedPriceCurrency: optimismUsdcContractAddress
              }
            });
          },
          onError: (err: any) => {
            setSubmitError(
              err.message || 'Something went wrong. Check your wallet is connected and has a sufficient balance'
            );
            log.error('Mint failed', { error: err });
          }
        }
      );
    }
  };

  useEffect(() => {
    if (decentSdkError) {
      log.error('Error on NFT Purchase calling useBoxAction from Decent SDK', {
        params: decentAPIParams,
        error: decentSdkError
      });
    }
  }, [decentSdkError]);

  const isLoading =
    isSavingDecentTransaction ||
    isLoadingDecentSdk ||
    isFetchingPrice ||
    isExecutingTransaction ||
    isExecutingPointsPurchase;

  const displayedBalance =
    balances?.chainId !== selectedPaymentOption.chainId || balances.address !== address
      ? undefined
      : selectedPaymentOption.currency === 'ETH'
      ? (Number(balances?.eth || 0) / 1e18).toFixed(4)
      : (Number(balances.usdc || 0) / 1e6).toFixed(2);

  const approvalRequired =
    paymentMethod === 'wallet' &&
    selectedPaymentOption.currency === 'USDC' &&
    typeof allowance === 'bigint' &&
    allowance < (typeof amountToPay === 'bigint' ? amountToPay : BigInt(0));

  if (hasPurchasedWithPoints || (savedDecentTransaction && transactionHasSucceeded)) {
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
            alt={builder.username}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '40%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
        <Typography textAlign='center' fontWeight={600} color='secondary'>
          {pricePerNft}
        </Typography>
      </Box>
      <Stack gap={1}>
        <Typography color='secondary'>Select quantity</Typography>
        <ToggleButtonGroup
          value={tokensToBuy}
          onChange={(_: React.MouseEvent<HTMLElement>, n: number) => setTokensToBuy((prevN) => n || prevN)}
          exclusive
          fullWidth
          aria-label='quantity selection'
        >
          {initialQuantities.map((q) => (
            <ToggleButton sx={{ minWidth: 60, minHeight: 40 }} key={q} value={q} aria-label={q.toString()}>
              {q}
            </ToggleButton>
          ))}
          <ToggleButton
            sx={{ fontSize: 14, textTransform: 'none' }}
            value={2}
            aria-label='custom'
            onClick={() => setTokensToBuy(2)}
          >
            Custom
          </ToggleButton>
        </ToggleButtonGroup>
        {!initialQuantities.includes(tokensToBuy) && (
          <Stack flexDirection='row' gap={2}>
            <IconButton color='secondary' onClick={() => setTokensToBuy((prevN) => prevN - 1)}>
              -
            </IconButton>
            <NumberInputField
              fullWidth
              color='secondary'
              id='builderId'
              type='number'
              placeholder='Quantity'
              value={tokensToBuy}
              onChange={(e) => setTokensToBuy(parseInt(e.target.value))}
              disableArrows
              sx={{ '& input': { textAlign: 'center' } }}
            />
            <IconButton color='secondary' onClick={() => setTokensToBuy((prevN) => prevN + 1)}>
              +
            </IconButton>
          </Stack>
        )}
      </Stack>
      <Stack>
        <Stack flexDirection='row' alignItems='center' gap={1} mb={1}>
          <Typography color='secondary'>Total cost</Typography>
          <Link href='/info#builder-nfts' target='_blank' title='Read how Builder NFTs are priced'>
            <InfoIcon sx={{ fontSize: 16, opacity: 0.5 }} />
          </Link>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography variant='caption' color='secondary' sx={{ width: '33%' }}>
            Qty
          </Typography>
          <Typography
            variant='caption'
            color='secondary'
            align='center'
            sx={{ position: 'relative', top: -4, width: '33%' }}
          >
            Points{' '}
            <Box display='inline' position='relative' top={4}>
              <PointsIcon size={18} color='blue' />
            </Box>{' '}
            (50% off)
          </Typography>
          <Typography variant='caption' color='secondary' align='right' sx={{ width: '33%' }}>
            USDC $
          </Typography>
        </Stack>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography sx={{ width: '33%' }}>{tokensToBuy} NFT</Typography>
          <Typography align='center' sx={{ width: '33%' }}>
            {purchaseCost && (
              <>
                {purchaseCostInPoints.toLocaleString()}{' '}
                <Box display='inline' position='relative' top={4}>
                  <PointsIcon size={18} />
                </Box>
              </>
            )}
            {isFetchingPrice && <CircularProgress size={16} />}
          </Typography>
          <Typography align='right' sx={{ width: '33%' }}>
            {purchaseCost && convertCostToUsd(purchaseCost)}
            {isFetchingPrice && <CircularProgress size={16} />}
          </Typography>
        </Stack>
      </Stack>
      <Stack>
        <Typography color='secondary' mb={1}>
          Select payment
        </Typography>
        <RadioGroup
          row
          aria-label='payment method'
          name='payment-method'
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as 'points' | 'wallet')}
          sx={{ mb: 2, display: 'flex', gap: 2, width: '100%' }}
        >
          <FormControlLabel sx={{ width: '50%' }} value='wallet' control={<Radio />} label='Wallet' />
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
              onSelectChain={(_paymentOption) => {
                setSelectedPaymentOption(_paymentOption);
              }}
            />
            {!hasSufficientBalance && balanceDataFromCorrectChain && !!amountToPay ? (
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

      {!approvalRequired ||
      isExecutingTransaction ||
      isExecutingPointsPurchase ||
      // Show disabled buy button if the user has insufficient balance, instead of the approve button
      (!hasSufficientBalance && balanceDataFromCorrectChain) ? (
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
            (paymentMethod === 'wallet' && !hasSufficientBalance && !!balanceDataFromCorrectChain) ||
            (!approvalRequired && isLoadingAllowance)
          }
        >
          Buy
        </LoadingButton>
      ) : (
        <ERC20ApproveButton
          spender={actionResponse?.tx.to as Address}
          chainId={selectedPaymentOption.chainId}
          erc20Address={getCurrencyContract(selectedPaymentOption) as Address}
          amount={amountToPay}
          onSuccess={() => refreshAllowance()}
        />
      )}
      {decentSdkError instanceof Error ? (
        <Typography variant='caption' color='error' align='center'>
          {(decentSdkError as Error).message}
        </Typography>
      ) : null}
      {submitError && (
        <Typography variant='caption' color='error' align='center'>
          {submitError}
        </Typography>
      )}
    </Stack>
  );
}
