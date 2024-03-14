import { log } from '@charmverse/core/log';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';

import { getTokenDecimals } from './getTokenDecimals';

export async function getTokenSupplyAmount({
  chainId,
  tokenContractAddress
}: {
  tokenContractAddress: string;
  chainId: number;
}) {
  const tokenDecimal = await getTokenDecimals({ chainId, tokenContractAddress });
  const chain = getChainById(chainId);
  if (!chain || tokenDecimal === null) {
    log.error('Chain not found or token decimal not found', {
      chainId,
      tokenContractAddress
    });
    throw new Error('Chain not found or token decimal not found');
  }

  const rpcUrl = chain.rpcUrls[0];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    ['function totalSupply() view returns (uint256)'],
    provider
  );

  const totalSupply = await tokenContract.totalSupply();
  return Number(ethers.utils.formatUnits(totalSupply, tokenDecimal));
}
