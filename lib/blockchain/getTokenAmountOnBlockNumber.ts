import { AlchemyProvider } from '@ethersproject/providers';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';

export async function getTokenAmountOnBlockNumber({
  blockNumber,
  tokenContractAddress,
  walletAddress,
  chainId
}: {
  tokenContractAddress: string;
  walletAddress: string;
  blockNumber: number;
  chainId: number;
}) {
  // const chain = getChainById(11155111);
  // if (!chain || chain.rpcUrls.length === 0) {
  //   return null;
  // }

  // // const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]);

  // const alchemyProvider = new AlchemyProvider(chain.chainId, process.env.ALCHEMY_API_KEY);
  // const contract = new ethers.Contract(
  //   '0x0000000000000000000000000000000000000000',
  //   ['function balanceOf(address) view returns (uint)'],
  //   alchemyProvider
  // );
  // // const tokenContract = new ethers.Contract(
  // //   '0x0000000000000000000000000000000000000000',
  // //   ['function decimals() view returns (uint8)'],
  // //   alchemyProvider
  // // );

  // // const decimals = await tokenContract.decimals();
  // // console.log({ decimals });

  // const balance = (await contract.balanceOf(walletAddress, {
  //   blockTag: 19412469
  // })) as {
  //   hex: string;
  //   type: 'BigNumber';
  // } | null;

  // if (!balance) {
  //   return null;
  // }

  // const balanceBigNumber = ethers.utils.formatUnits(ethers.BigNumber.from(balance.hex), 18);
  // return balanceBigNumber;

  return 12345678910;
}
