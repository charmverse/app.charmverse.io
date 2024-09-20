/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import { log } from '@charmverse/core/log';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Button, Typography } from '@mui/material';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { useEffect, useState } from 'react';
import { encodeAbiParameters, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnect } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';

import { builderContractAddress, decentApiKey, readonlyApiClient, demoBuilderId } from './constants';
import { ContractApiClient } from './nftContractApiClient';

type NFT = {
  id: string;
  name: string;
  image: string;
  price: string;
  contractAddress: string;
};

const builderNFT = {
  id: '0',
  name: 'Demo NFT',
  image: 'https://i.seadn.io/s/raw/files/0f99f7f286b690990ac2738d02e52f2e.png?auto=format&dpr=1&w=1000',
  price: '0.006',
  contractAddress: '0x7df4d9f54a5cddfef50a032451f694d6345c60af'
};

function NFTPurchaseButton({ builderId }: { builderId: string }) {
  const { address, walletClient } = useWallet();

  // const [nftApiClient, setNftApiClient] = useState<ContractApiClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

  const { sendTransaction } = useSendTransaction();

  async function refreshAsk(amount: number) {
    if (builderTokenId && tokensToBuy) {
      const _price = await readonlyApiClient.getTokenPurchasePrice({
        args: { amount: BigInt(amount), tokenId: BigInt(builderTokenId) }
      });
      setPurchaseCost(_price);
    }
  }

  async function refreshTokenData() {
    setFetchError(null);
    try {
      setIsFetchingPrice(true);
      const _builderTokenId = await readonlyApiClient.getTokenIdForBuilder({ args: { builderId } });

      setBuilderTokenId(_builderTokenId);

      await refreshAsk(tokensToBuy);

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
    if (tokensToBuy) {
      refreshAsk(tokensToBuy);
    }
  }, [tokensToBuy, refreshAsk]);

  const { error, isLoading, actionResponse } = useBoxAction({
    enable: !!purchaseCost && !!address,
    // actionType: ActionType.EvmCalldataTx,
    actionType: ActionType.EvmFunction,
    sender: address || '',
    srcToken: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // Use native token (ETH)
    srcChainId: ChainId.BASE,
    dstToken: '0x0000000000000000000000000000000000000000',
    dstChainId: ChainId.BASE,
    slippage: 1, // 1% slippage
    actionConfig: {
      chainId: ChainId.BASE,
      contractAddress: builderContractAddress,
      data: encodeAbiParameters(
        [
          { name: 'tokenId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'scout', type: 'string' }
        ],
        [BigInt(1), BigInt(1), demoBuilderId]
      )
    }
  });

  const handlePurchase = async () => {
    if (!purchaseCost) {
      log.info('Purchase cost not available');
      return;
    }

    console.log('actionResponse', actionResponse);

    const tx = actionResponse?.tx as EvmTransaction;

    sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      gasPrice: BigInt(4e7)
    });
  };

  console.log({
    builderId,
    builderTokenId,
    purchaseCost,
    tokensToBuy
  });

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
          {isLoading ? 'Purchasing...' : 'Purchase NFT'}
        </Button>
      </div>

      {error instanceof Error ? <Typography color='error'>Error: {(error as Error).message}</Typography> : null}
    </div>
  );
}

function NFTPurchaseWithLogin({ builderId }: { builderId: string }) {
  const { address } = useWallet(); // Hook to access the connected wallet details

  return (
    <BoxHooksContextProvider apiKey={decentApiKey}>
      {address && <NFTPurchaseButton builderId={builderId} />}
      {!address && <WalletConnect />}
    </BoxHooksContextProvider>
  );
}

export function NFTPurchase({ builderId }: { builderId: string }) {
  return (
    <WagmiProvider>
      <NFTPurchaseWithLogin builderId={builderId} />
    </WagmiProvider>
  );
}
