import {
  getNFTs as getNFTsFromAlchemy,
  getNFT as getNFTFromAlchemy,
  getNFTOwners as getNFTOwnersFromAlchemy
} from './provider/alchemy/client';
import { getPublicClient } from './publicClient';

export async function readNftContract({
  contractAddress,
  tokenId,
  quantity,
  chainId
}: {
  contractAddress: string;
  tokenId?: string;
  quantity: string;
  chainId: number;
}) {
  const publicClient = getPublicClient(chainId);
}
