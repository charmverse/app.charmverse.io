import env from '@beam-australia/react-env';
import { log } from '@charmverse/core/log';
import { ActionType } from '@decent.xyz/box-common';
import type { BoxActionRequest, BoxActionResponse } from '@decent.xyz/box-common';
import {
  getBuilderContractAddress,
  usdcOptimismMainnetContractAddress,
  getDecentApiKey,
  builderNftChain,
  optimismUsdcContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { GET } from '@packages/utils/http';
import useSWR from 'swr';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

type DecentTransactionProps = {
  address: Address;
  sourceChainId: number;
  sourceToken: Address;
  paymentAmountOut: bigint;
  builderTokenId: bigint;
  tokensToPurchase: bigint;
  scoutId: string;
};

async function prepareDecentTransaction({ txConfig }: { txConfig: BoxActionRequest }): Promise<BoxActionResponse> {
  const DECENT_API_KEY = getDecentApiKey();

  const response = await GET<BoxActionResponse>(
    'https://box-v3-2-0.api.decent.xyz/api/getBoxAction',
    { arguments: txConfig },
    {
      headers: {
        'x-api-key': DECENT_API_KEY
      },
      credentials: 'omit'
    }
  );

  return response;
}

export function useDecentTransaction({
  address,
  paymentAmountOut,
  sourceChainId,
  sourceToken,
  builderTokenId,
  scoutId,
  tokensToPurchase
}: DecentTransactionProps) {
  const decentAPIParams: BoxActionRequest = {
    sender: address as `0x${string}`,
    srcToken: sourceToken,
    dstToken: optimismUsdcContractAddress,
    srcChainId: sourceChainId,
    dstChainId: builderNftChain.id,
    slippage: 1,
    actionType: ActionType.NftMint,
    // @ts-ignore
    actionConfig: {
      chainId: optimism.id,
      contractAddress: getBuilderContractAddress(),
      cost: {
        amount: paymentAmountOut,
        isNative: false,
        tokenAddress: optimismUsdcContractAddress
      },
      signature: 'function mint(address account, uint256 tokenId, uint256 amount, string scout)',
      args: [address, builderTokenId, tokensToPurchase, scoutId]
    }
  };

  const {
    error: decentSdkError,
    isLoading: isLoadingDecentSdk,
    data: decentTransactionInfo
  } = useSWR(
    address ? `buy-token-${builderTokenId}-${tokensToPurchase}-${sourceChainId}-${sourceToken}-${scoutId}` : null,
    () =>
      prepareDecentTransaction({
        txConfig: decentAPIParams
      }).catch((error) => {
        log.error(`Error preparing decent transaction`, { error, decentAPIParams });
        throw error;
      }),
    {
      shouldRetryOnError: (error) => {
        log.info(`Retrying decent tx`, { decentAPIParams, error });
        return true;
      },
      errorRetryInterval: 1000
    }
  );

  return {
    decentSdkError,
    isLoadingDecentSdk,
    decentTransactionInfo
  };
}
