/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ActionType, ChainId, SwapDirection } from '@decent.xyz/box-common';
import type { UseBoxActionArgs } from '@decent.xyz/box-hooks';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Alert, Button, Typography } from '@mui/material';
import { getChainById } from '@packages/onchain/chains';
import { BuilderNFTSeasonOneClient } from '@packages/scoutgame/builderNfts/BuilderNFTSeasonOneClient';
import {
  builderContractAddress,
  builderNftChain,
  useTestnets,
  usdcContractAddress,
  treasuryAddress
} from '@packages/scoutgame/builderNfts/constants';
import { USDcAbiClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnect } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';
import { mintNftAction } from 'lib/builderNFTs/mintNftAction';

import type { ChainOption } from './ChainSelector';
import { BlockchainSelect, getChainOptions } from './ChainSelector';

const readonlyApiClient = new BuilderNFTSeasonOneClient({
  chain: builderNftChain,
  contractAddress: builderContractAddress,
  publicClient: getPublicClient(builderNftChain.id)
});

export type NFTPurchaseProps = {
  builderId: string;
  user: {
    username: string;
  };
};

function NFTPurchaseButton({ builderId, user }: NFTPurchaseProps) {
  const { address, walletClient, chainId } = useWallet();

  const [sourceFundsChain, setSourceFundsChain] = useState(ChainId.OPTIMISM_SEPOLIA);

  // const [nftApiClient, setNftApiClient] = useState<BuilderNFTSeasonOneClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  const [balances, setBalances] = useState<{ usdc: bigint; eth: bigint; chainId: number } | null>(null);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const { isExecuting, hasSucceeded, executeAsync, result } = useAction(mintNftAction, {
    onSuccess() {
      log.info('NFT minted');
    },
    onError(err) {
      log.error('Error minting NFT', { error: err });
    }
  });

  const refreshBalance = useCallback(async () => {
    const chainOption = getChainOptions({ useTestnets }).find((opt) => opt.id === sourceFundsChain) as ChainOption;

    const chain = chainOption?.chain;

    const _chainId = chain.id;

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
  }, [sourceFundsChain, refreshBalance]);

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

  const txArgs: UseBoxActionArgs = {
    sender: '0xCF1bAA2EE2d3427B4dB2EA5fa4A250E8b44e75d9',
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    srcChainId: ChainId.BASE,
    dstChainId: ChainId.OPTIMISM,
    slippage: 1,
    actionType: ActionType.SwapAction,
    // @ts-ignore
    actionConfig: {
      amount: purchaseCost,
      swapDirection: SwapDirection.EXACT_AMOUNT_IN,
      receiverAddress: '0x9b56c451f593e1BF5E458A3ecaDfD3Ef17A36998'
    }
  };

  const { error, isLoading, actionResponse } = useBoxAction(txArgs);

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
            address: address as string,
            tokenId: builderTokenId.toString(),
            amount: tokensToBuy,
            builderId,
            sourceTxChainId: sourceFundsChain,
            txHash: data
          });
        },
        onError: (err: any) => {
          log.error('Mint failed', { error: err });
        }
      }
    );
  };

  return (
    <div>
      <h1>NFT Purchase on {builderNftChain.name}</h1>

      <label htmlFor='builderId'>Amount of tokens</label>
      <input
        type='number'
        placeholder='Search NFTs'
        value={tokensToBuy}
        onChange={(e) => setTokensToBuy(parseInt(e.target.value))}
      />

      <div>
        <h3>Token ID: {builderTokenId}</h3>
        {purchaseCost && <p>Price: {formatUnits(purchaseCost, 6)} USDC</p>}
        {isFetchingPrice && <p>Fetching price...</p>}

        <BlockchainSelect
          // value={sourceFundsChain as any}
          useTestnets={useTestnets}
          onSelectChain={(_chainId) => {
            setSourceFundsChain(_chainId);
          }}
        />

        {balances?.chainId === sourceFundsChain && !!sourceFundsChain && (
          <div>
            <Typography>
              Your USDC Balance on {getChainById(sourceFundsChain)?.chainName}: ${' '}
              {(Number(balances.usdc || 0) / 10e6).toFixed(2)}
            </Typography>
          </div>
        )}
        {fetchError && <p color='red'>{fetchError.shortMessage || 'Something went wrong'}</p>}
        <Button onClick={handlePurchase} disabled={!purchaseCost || isLoading || isFetchingPrice}>
          {isFetchingPrice ? 'Fetching price' : isLoading ? 'Loading...' : 'Purchase NFT'}
        </Button>
      </div>

      {result.data && <Alert>Minted {tokensToBuy} tokens</Alert>}

      {error instanceof Error ? <Typography color='error'>Error: {(error as Error).message}</Typography> : null}
    </div>
  );
}

function NFTPurchaseWithLogin(props: NFTPurchaseProps) {
  const { address } = useWallet(); // Hook to access the connected wallet details

  const apiKey = env('DECENT_API_KEY');

  if (!apiKey) {
    log.warn('No DECENT_API_KEY found');
    return null;
  }

  return (
    <BoxHooksContextProvider apiKey={apiKey}>
      {address && <NFTPurchaseButton {...props} />}
      {!address && <WalletConnect />}
    </BoxHooksContextProvider>
  );
}

export function NFTPurchase(props: NFTPurchaseProps) {
  return (
    <WagmiProvider>
      <NFTPurchaseWithLogin {...props} />
    </WagmiProvider>
  );
}
