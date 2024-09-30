'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ActionType, ChainId, SwapDirection } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/builderNFTSeasonOneClient';
import {
  builderContractAddress,
  builderNftChain,
  builderTokenDecimals,
  usdcContractAddress,
  useTestnets
} from '@packages/scoutgame/builderNfts/constants';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { getChainById } from '@root/connectors/chains';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import Image from 'next/image';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnectForm } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';
import { handleMintNftAction } from 'lib/builderNFTs/handleMintNftAction';
import { mintNftAction } from 'lib/builderNFTs/mintNftAction';
import type { MinimalUserInfo } from 'lib/users/interfaces';

import { IconButton } from '../Button/IconButton';
import { NumberInputField } from '../Fields/NumberField';

import type { ChainOption } from './ChainSelector';
import { BlockchainSelect, getChainOptions } from './ChainSelector';

const readonlyApiClient = new BuilderNFTSeasonOneClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});

export type NFTPurchaseProps = {
  builder: MinimalUserInfo & { price?: bigint; nftImageUrl?: string | null };
};

function NFTPurchaseButton({ builder }: NFTPurchaseProps) {
  const builderId = builder.id;
  const initialQuantities = [1, 11, 111, 1111];
  const pricePerNft = (Number(builder.price) / 10 ** builderTokenDecimals).toFixed(2);
  const { address, chainId } = useWallet();

  const [sourceFundsChain, setSourceFundsChain] = useState(ChainId.OPTIMISM_SEPOLIA);

  // const [nftApiClient, setNftApiClient] = useState<BuilderNFTSeasonOneClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  const [balances, setBalances] = useState<{ usdc: bigint; eth: bigint; chainId: number } | null>(null);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);

  const {
    isExecuting: isHandleMintNftExecuting,
    hasSucceeded: hasHandleMintNftSucceeded,
    executeAsync: executeHandleMintNft
  } = useAction(handleMintNftAction, {});

  const {
    isExecuting: isExecutingMintNftAction,
    hasSucceeded: hasSucceededMintNftAction,
    executeAsync
  } = useAction(mintNftAction, {
    async onSuccess(res) {
      if (res.data?.id) {
        await executeHandleMintNft({ pendingTransactionId: res.data.id });
      }
      log.info('NFT minted', { chainId, builderTokenId, purchaseCost });
    },
    onError(err) {
      log.error('Error minting NFT', { chainId, builderTokenId, purchaseCost, error: err });
    }
  });

  useEffect(() => {
    readonlyApiClient.proceedsReceiver().then(setTreasuryAddress);
  }, []);

  const refreshBalance = useCallback(async () => {
    const chainOption = getChainOptions({ useTestnets }).find((opt) => opt.id === sourceFundsChain) as ChainOption;

    const chain = chainOption?.chain;

    const _chainId = chain?.id;

    if (!_chainId) {
      return;
    }

    const client = new USDcAbiClient({
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
      chainId: _chainId
    };

    setBalances(newBalances);

    return newBalances;
  }, [address, sourceFundsChain]);

  useEffect(() => {
    if (sourceFundsChain) {
      refreshBalance().catch((err) => {
        log.error('Error refreshing balance', { error: err });
      });
    }
  }, [sourceFundsChain]);

  const { sendTransaction } = useSendTransaction();

  const refreshAsk = useCallback(
    async ({ _builderTokenId, amount }: { _builderTokenId: bigint | number; amount: bigint | number }) => {
      const _price = await readonlyApiClient.getTokenQuote({
        args: { amount: BigInt(amount), tokenId: BigInt(_builderTokenId) }
      });
      setPurchaseCost(_price);
    },
    [setPurchaseCost]
  );

  async function refreshTokenData() {
    setFetchError(null);
    try {
      setIsFetchingPrice(true);
      const _builderTokenId = await readonlyApiClient.getTokenIdForBuilder({ args: { builderId } });

      setBuilderTokenId(_builderTokenId);

      await refreshAsk({ _builderTokenId, amount: tokensToBuy });

      setIsFetchingPrice(false);
    } catch (error) {
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

  const { error, isLoading, actionResponse } = useBoxAction({
    enable: !!address && !!treasuryAddress,
    sender: address as `0x${string}`,
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: usdcContractAddress,
    srcChainId: ChainId.BASE,
    dstChainId: ChainId.OPTIMISM,
    slippage: 1,
    actionType: ActionType.SwapAction,
    // @ts-ignore
    actionConfig: {
      amount: purchaseCost,
      swapDirection: SwapDirection.EXACT_AMOUNT_OUT,
      receiverAddress: treasuryAddress as string
    }
  });

  const handlePurchase = async () => {
    if (!actionResponse?.tx) {
      return;
    }

    sendTransaction(
      {
        to: actionResponse.tx.to as Address,
        data: actionResponse.tx.data as any,
        value: (actionResponse.tx as any).value
      },
      {
        onSuccess: async (data) => {
          await executeAsync({
            user: {
              walletAddress: address as `0x${string}`
            },
            transactionInfo: {
              destinationChainId: builderNftChain.id,
              sourceChainId: sourceFundsChain,
              sourceChainTxHash: data
            },
            purchaseInfo: {
              quotedPrice: Number(purchaseCost),
              tokenAmount: tokensToBuy,
              builderContractAddress,
              tokenId: Number(builderTokenId),
              quotedPriceCurrency: usdcContractAddress
            }
          });
        },
        onError: (err: any) => {
          log.error('Mint failed', { error: err });
        }
      }
    );
  };

  if (hasHandleMintNftSucceeded) {
    return (
      <Stack gap={2} textAlign='center'>
        <Typography color='secondary' variant='h5' fontWeight={600}>
          Congratulations!
        </Typography>
        <Typography>You scouted @{builder.username}</Typography>
        <Box
          bgcolor='black.dark'
          width='100%'
          p={2}
          display='flex'
          alignItems='center'
          flexDirection='column'
          gap={1}
          py={12}
          sx={{
            background: 'url(/images/nft-mint-bg.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          {builder.nftImageUrl ? (
            <Image
              src='/builder-nfts/13.png'
              alt={builder.username}
              width={200}
              height={300}
              style={{ aspectRatio: '1/1.4', width: '50%', height: '50%' }}
            />
          ) : (
            <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
          )}
        </Box>
        <Button
          LinkComponent={Link}
          fullWidth
          href={`https://warpcast.com/~/compose?text=${encodeURI(
            `I scouted ${builder.username} on Scout Game!`
          )}&embeds[]=${window.location.origin}/u/${builder.username}`}
          target='_blank'
          rel='noopener noreferrer'
        >
          Share now
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap={3}>
      <Box bgcolor='black.dark' width='100%' p={2} display='flex' alignItems='center' flexDirection='column' gap={1}>
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.username}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '50%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
        <Typography textAlign='center' fontWeight={600} color='secondary'>
          ${pricePerNft}
        </Typography>
      </Box>
      <Stack gap={2}>
        <Typography color='secondary' mb='0'>
          Select quantity
        </Typography>
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
          <ToggleButton value={2} aria-label='custom' onClick={() => setTokensToBuy(2)}>
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
      <Stack gap={1}>
        <Typography color='secondary'>Total cost</Typography>
        <Stack flexDirection='row' justifyContent='space-between'>
          <Typography>
            {tokensToBuy} NFT x ${pricePerNft}
          </Typography>
          <Typography>{(tokensToBuy * Number(pricePerNft)).toFixed(2)}</Typography>
        </Stack>
      </Stack>
      <Stack gap={1}>
        {purchaseCost && <p>Price: {formatUnits(purchaseCost, 6)} USDC</p>}
        {isFetchingPrice && <p>Fetching price...</p>}
        <Typography color='secondary'>Select payment</Typography>
        <BlockchainSelect
          value={sourceFundsChain as any}
          balance={(Number(balances?.usdc || 0) / 1e6).toFixed(2)}
          useTestnets={useTestnets}
          onSelectChain={(_chainId) => {
            setSourceFundsChain(_chainId);
          }}
        />
      </Stack>
      {fetchError && <Typography color='red'>{fetchError.shortMessage || 'Something went wrong'}</Typography>}
      <Button
        onClick={handlePurchase}
        disabled={
          !purchaseCost ||
          isLoading ||
          isFetchingPrice ||
          !treasuryAddress ||
          isExecutingMintNftAction ||
          isHandleMintNftExecuting
        }
      >
        {isFetchingPrice ? 'Fetching price' : isLoading ? 'Loading...' : 'Buy'}
      </Button>
      {error instanceof Error ? <Typography color='error'>Error: {(error as Error).message}</Typography> : null}
    </Stack>
  );
}

function NFTPurchaseWithLogin(props: NFTPurchaseProps) {
  const { address } = useWallet(); // Hook to access the connected wallet details

  // Waiting for component to render before fetching the API key
  const apiKey = env('DECENT_API_KEY');

  if (!address) {
    return <WalletConnectForm />;
  }

  if (!apiKey) {
    return <Typography color='error'>Decent API key not found</Typography>;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey}>{address && <NFTPurchaseButton {...props} />}</BoxHooksContextProvider>
  );
}

export function NFTPurchaseForm(props: NFTPurchaseProps) {
  return (
    <WagmiProvider>
      <NFTPurchaseWithLogin {...props} />
    </WagmiProvider>
  );
}
