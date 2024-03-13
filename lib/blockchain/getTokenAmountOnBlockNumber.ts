import { getChainById } from 'connectors/chains';
import { BigNumber, ethers } from 'ethers';

export async function getTokenAmountOnBlockNumber({
  blockNumber,
  tokenContractAddress,
  chainId,
  walletAddress
}: {
  tokenContractAddress: string;
  blockNumber: string;
  chainId: number;
  walletAddress: string;
}) {
  const chain = getChainById(chainId);
  if (!chain) {
    return 0;
  }

  const rpcUrl = chain.rpcUrls[0];
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const abi = ['function balanceOf(address account) external view returns (uint256)'];
  const tokenContract = new ethers.Contract(tokenContractAddress, abi, provider);
  const balance = await tokenContract.balanceOf(walletAddress, { blockTag: BigNumber.from(blockNumber).toNumber() });
  return Number(ethers.utils.formatUnits(balance, 18));
}
