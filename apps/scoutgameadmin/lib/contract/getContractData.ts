import { builderContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderContractReadClient';
import { builderProxyContractReadonlyApiClient } from '@packages/scoutgame/builderNfts/clients/builderProxyContractReadClient';
import { getBuilderContractAddress } from '@packages/scoutgame/builderNfts/constants';
import type { Address } from 'viem';

export type BuilderNFTContractData = {
  currentAdmin: Address;
  currentImplementation: Address;
  proceedsReceiver: Address;
  totalSupply: bigint;
  contractAddress: Address;
};

export async function getContractData(): Promise<BuilderNFTContractData> {
  const [currentAdmin, currentImplementation, proceedsReceiver, totalSupply] = await Promise.all([
    builderProxyContractReadonlyApiClient.admin(),
    builderProxyContractReadonlyApiClient.implementation(),
    builderProxyContractReadonlyApiClient.getProceedsReceiver(),
    builderContractReadonlyApiClient.totalBuilderTokens()
  ]);

  return {
    currentAdmin: currentAdmin as Address,
    currentImplementation: currentImplementation as Address,
    proceedsReceiver: proceedsReceiver as Address,
    totalSupply,
    contractAddress: getBuilderContractAddress()
  };
}
