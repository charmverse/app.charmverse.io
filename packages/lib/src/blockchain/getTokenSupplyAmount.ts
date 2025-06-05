import { log } from '@charmverse/core/log';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { getTokenMetadata } from '@packages/lib/tokens/getTokenMetadata';
import { ethers } from 'ethers';
import { formatUnits } from 'viem';

export async function getTokenSupplyAmount({
  chainId,
  tokenContractAddress
}: {
  tokenContractAddress: string;
  chainId: number;
}) {
  const chain = getChainById(chainId);
  if (!chain) {
    log.error('Chain not found or token decimal not found', {
      chainId,
      tokenContractAddress
    });
    throw new Error('Chain not found or token decimal not found');
  }

  const tokenMetadata = await getTokenMetadata({
    chainId,
    contractAddress: tokenContractAddress
  });

  const tokenDecimals = tokenMetadata.decimals;
  const rpcUrl = chain.rpcUrls[0];
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    ['function totalSupply() view returns (uint256)'],
    provider
  );

  const totalSupply = await tokenContract.totalSupply();
  return Number(formatUnits(totalSupply, tokenDecimals));
}
