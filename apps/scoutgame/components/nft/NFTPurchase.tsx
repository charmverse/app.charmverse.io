/* eslint-disable jsx-a11y/label-has-associated-control */

'use client';

import { log } from '@charmverse/core/log';
import type { Scout } from '@charmverse/core/prisma-client';
import type { EvmTransaction } from '@decent.xyz/box-common';
import { ActionType, ChainId } from '@decent.xyz/box-common';
import { BoxHooksContextProvider, useBoxAction } from '@decent.xyz/box-hooks';
import { Button, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { encodeAbiParameters, formatUnits } from 'viem';
import { useSendTransaction } from 'wagmi';

import { WagmiProvider } from 'components/common/WalletLogin/WagmiProvider';
import { WalletConnect } from 'components/common/WalletLogin/WalletConnect';
import { useWallet } from 'hooks/useWallet';
import { builderContractAddress, decentApiKey, readonlyApiClient } from 'lib/builderNFTs/constants';

type NFTPurchaseProps = {
  builderId: string;
  scout: Scout;
};

function NFTPurchaseButton({ builderId, scout }: NFTPurchaseProps) {
  const { address, walletClient } = useWallet();

  // const [nftApiClient, setNftApiClient] = useState<ContractApiClient>(null);

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);

  const [fetchError, setFetchError] = useState<any>(null);

  const [tokensToBuy, setTokensToBuy] = useState(1);

  // Data from onchain
  const [purchaseCost, setPurchaseCost] = useState(BigInt(0));
  const [builderTokenId, setBuilderTokenId] = useState<bigint>(BigInt(0));

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
    enable: !!purchaseCost && !!address,
    // actionType: ActionType.EvmCalldataTx,
    actionType: ActionType.EvmFunction,
    sender: address || '',
    srcToken: '0x0000000000000000000000000000000000000000', // Use native token (ETH)
    srcChainId: ChainId.OPTIMISM_SEPOLIA,
    dstToken: '0x0000000000000000000000000000000000000000',
    dstChainId: ChainId.BASE_SEPOLIA,
    slippage: 1, // 1% slippage
    actionConfig: {
      chainId: ChainId.BASE,
      contractAddress: builderContractAddress,
      data: encodeAbiParameters(
        [
          { name: 'tokenId', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'scout', type: 'builderId' }
        ],
        [BigInt(builderTokenId), BigInt(1), scout.id]
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

function NFTPurchaseWithLogin(props: NFTPurchaseProps) {
  const { address } = useWallet(); // Hook to access the connected wallet details

  return (
    <BoxHooksContextProvider apiKey={decentApiKey}>
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
