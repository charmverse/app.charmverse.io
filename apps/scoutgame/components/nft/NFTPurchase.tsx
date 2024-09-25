/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Button, Typography } from '@mui/material';
import { builderContractAddress, builderNftChain } from '@packages/scoutgame/builderNfts/constants';
import { ContractApiClient } from '@packages/scoutgame/builderNfts/nftContractApiClient';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnect } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';
import { mintNftAction } from 'lib/builderNFTs/mintNftAction';

const readonlyApiClient = new ContractApiClient({
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
  const { address, walletClient } = useWallet();

  // const [nftApiClient, setNftApiClient] = useState<ContractApiClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const { isExecuting, hasSucceeded, executeAsync } = useAction(mintNftAction, {
    onSuccess() {
      log.info('NFT minted');
    },
    onError(err) {
      log.error('Error minting NFT', { error: err });
    }
  });

  const { sendTransaction } = useSendTransaction();

  const refreshAsk = useCallback(
    async ({ _builderTokenId, amount }: { _builderTokenId: bigint | number; amount: bigint | number }) => {
      const _price = await readonlyApiClient.getTokenPurchasePrice({
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

  const { error, isLoading, actionResponse } = useBoxAction({
    enable: !!purchaseCost && !!address && !!builderTokenId && !!tokensToBuy,
    // actionType: ActionType.EvmCalldataTx,
    actionType: ActionType.EvmFunction,
    sender: address as string,
    srcToken: '0x0000000000000000000000000000000000000000',
    dstToken: '0x0000000000000000000000000000000000000000',
    slippage: 1,
    srcChainId: ChainId.OPTIMISM,
    dstChainId: ChainId.BASE,
    actionConfig: {
      chainId: ChainId.BASE,
      contractAddress: builderContractAddress,
      cost: {
        amount: purchaseCost,
        isNative: true,
        tokenAddress: '0x0000000000000000000000000000000000000000'
      },
      signature: 'function buyToken(uint256 tokenId, uint256 amount, string scout)',
      args: [builderTokenId, tokensToBuy, user.username]
    }
  });

  const handlePurchase = async () => {
    if (!actionResponse?.tx) {
      return;
    }

    const tx = actionResponse?.tx as EvmTransaction;

    log.info('Executing purchase');

    await executeAsync({
      address: address as string,
      tokenId: builderTokenId.toString(),
      amount: tokensToBuy,
      builderId
    });

    log.info('Purchase complete');

    // sendTransaction({
    //   to: tx.to,
    //   data: tx.data,
    //   value: tx.value
    // });
  };

  return (
    <div>
      <h1>NFT Purchase on Base Testnet</h1>

      <label htmlFor='builderId'>Amount of tokens</label>
      <input
        type='number'
        placeholder='Search NFTs'
        value={tokensToBuy}
        onChange={(e) => setTokensToBuy(parseInt(e.target.value))}
      />

      <div>
        <h3>Token ID: {builderTokenId}</h3>
        {purchaseCost && <p>Price: {formatUnits(purchaseCost, 18)} ETH</p>}
        {isFetchingPrice && <p>Fetching price...</p>}
        {fetchError && <p color='red'>{fetchError.shortMessage || 'Something went wrong'}</p>}
        <Button onClick={handlePurchase} disabled={!purchaseCost || isLoading || isFetchingPrice}>
          {isFetchingPrice ? 'Fetching price' : isLoading ? 'Purchasing...' : 'Purchase NFT'}
        </Button>
      </div>

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
