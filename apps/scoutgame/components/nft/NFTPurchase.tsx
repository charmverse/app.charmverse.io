'use client';

import { log } from '@charmverse/core/log';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Button, Typography } from '@mui/material';
import { getPublicClient } from '@root/lib/blockchain/publicClient';
import { useEffect, useState } from 'react';
import { encodeAbiParameters } from 'viem';
import { base } from 'viem/chains';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnect } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';

import { builderContractAddress, decentApiKey, readonlyApiClient } from './constants';
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
    setTokensToBuy(amount);
    const _price = await readonlyApiClient.getTokenPurchasePrice({
      args: { amount: BigInt(tokensToBuy), tokenId: BigInt(builderTokenId) }
    });
    setPurchaseCost(_price);
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

  const { error, isLoading, actionResponse } = useBoxAction({
    enable: !!purchaseCost,
    actionType: ActionType.EvmCalldataTx,
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
        [BigInt(1), BigInt(1), '8681eb2c-c220-44c9-9a01-5bcfd074ab57']
      )
    }
  });

  const handlePurchase = async () => {
    if (!purchaseCost) {
      log.info('Purchase cost not available');
      return;
    }
    const tx = actionResponse?.tx as EvmTransaction;

    sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value
    });
  };

  return (
    <div>
      <h1>NFT Purchase on Base Testnet</h1>

      <input
        type='number'
        placeholder='Search NFTs'
        value={tokensToBuy}
        onChange={(e) => setTokensToBuy(parseInt(e.target.value))}
      />

      <div>
        <h2>Selected NFT: {builderTokenId}</h2>
        <p>Price: {purchaseCost} ETH</p>
        <Button onClick={handlePurchase} disabled={isLoading}>
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
    <WagmiProvider>
      <BoxHooksContextProvider apiKey={decentApiKey}>
        {address && <NFTPurchaseButton builderId={builderId} />}
        {!address && <WalletConnect />}
      </BoxHooksContextProvider>
    </WagmiProvider>
  );
}

export function NFTPurchase({ builderId }: { builderId: string }) {
  return (
    <WagmiProvider>
      <NFTPurchaseWithLogin builderId={builderId} />
    </WagmiProvider>
  );
}
