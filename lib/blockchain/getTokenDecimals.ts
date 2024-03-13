import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';

export async function getTokenDecimals({
  chainId,
  tokenContractAddress
}: {
  tokenContractAddress: string;
  chainId: number;
}) {
  const chain = getChainById(chainId);
  if (!chain) {
    return null;
  }

  const rpcUrl = chain.rpcUrls[0];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const tokenContract = new ethers.Contract(
    tokenContractAddress,
    ['function decimals() view returns (uint8)'],
    provider
  );

  const decimals = await tokenContract.decimals();
  return decimals ? Number(decimals) : null;
}
