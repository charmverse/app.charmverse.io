import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { builderProxyContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderProxyContractReadClient';
import {
  getBuilderContractAddress,
  usdcOptimismMainnetContractAddress
} from '@packages/scoutgame/builderNfts/constants';
import { UsdcErc20ABIClient } from '@packages/scoutgame/builderNfts/usdcContractApiClient';
import type { Address } from 'viem';
import { optimism } from 'viem/chains';

import { getPublicClient } from '../../../../packages/blockchain/src/getPublicClient';

import { aggregateNftSalesData, type NftSalesData } from './aggregateNftSalesData';

export type BuilderNFTContractData = {
  currentAdmin: Address;
  currentMinter: Address;
  currentImplementation: Address;
  proceedsReceiver: Address;
  totalSupply: bigint;
  contractAddress: Address;
  receiverUsdcBalance: number;
  nftSalesData: NftSalesData;
};

export async function getContractData(): Promise<BuilderNFTContractData> {
  const [currentAdmin, currentMinter, currentImplementation, proceedsReceiver, totalSupply, nftSalesData] =
    await Promise.all([
      builderProxyContractReadonlyApiClient.admin(),
      builderContractReadonlyApiClient.getMinter(),
      builderProxyContractReadonlyApiClient.implementation(),
      builderProxyContractReadonlyApiClient.getProceedsReceiver(),
      builderContractReadonlyApiClient.totalBuilderTokens(),
      aggregateNftSalesData()
    ]);

  const balance = await new UsdcErc20ABIClient({
    chain: optimism,
    publicClient: getPublicClient(optimism.id),
    contractAddress: usdcOptimismMainnetContractAddress
  }).balanceOf({ args: { account: proceedsReceiver } });

  return {
    currentAdmin: currentAdmin as Address,
    currentMinter: currentMinter as Address,
    currentImplementation: currentImplementation as Address,
    proceedsReceiver: proceedsReceiver as Address,
    totalSupply,
    contractAddress: getBuilderContractAddress(),
    receiverUsdcBalance: Number(balance / BigInt(1e6)),
    nftSalesData
  };
}
