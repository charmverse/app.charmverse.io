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
    return null;
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
