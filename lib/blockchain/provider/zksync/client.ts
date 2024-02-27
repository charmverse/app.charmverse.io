import { InvalidInputError } from '@charmverse/core/errors';
import ERC721_ABI from 'abis/ERC721.json';
import { RateLimit } from 'async-sema';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import { zkSync, zkSyncTestnet } from 'viem/chains';
import { Provider } from 'zksync-web3';

import { GET } from 'adapters/http';
import type { NFTData } from 'lib/blockchain/getNFTs';
import { lowerCaseEqual } from 'lib/utils/strings';

import { supportedNetworks, type SupportedChainId } from './config';

const ZK_MAINNET_BLOCK_EXPLORER = 'https://block-explorer-api.mainnet.zksync.io';
const ZK_TESTNET_BLOCK_EXPLORER = 'https://block-explorer-api.testnets.zksync.dev';
type IpfsNft = {
  name: string;
  description: string;
  image: string;
};

type BlockExplorerNft = { timeStamp: string; from: string; to: string; tokenID: string; contractAddress: string };

type BlockExplorerNftTransactionResponse = {
  status: '0' | '1';
  message: string;
  result: BlockExplorerNft[];
};

// 30 requests/minute with no api key
export const rateLimiter = RateLimit(0.5);
class ZkSyncApiClient {
  rpcUrl: string;

  blockExplorerUrl: string;

  provider: Provider;

  chainId: SupportedChainId;

  constructor({ chainId }: { chainId: SupportedChainId }) {
    if (!supportedNetworks.includes(chainId)) {
      throw new Error(`Unsupported chain id: ${chainId}`);
    }
    this.rpcUrl = (
      chainId === zkSync.id ? getChainById(zkSync.id)?.rpcUrls[0] : getChainById(zkSyncTestnet.id)?.rpcUrls[0]
    ) as string;
    this.chainId = chainId;
    this.provider = new Provider(this.rpcUrl, chainId);
    this.blockExplorerUrl = chainId === zkSync.id ? ZK_MAINNET_BLOCK_EXPLORER : ZK_TESTNET_BLOCK_EXPLORER;
  }

  getNftContract(contractAddress: string) {
    return new ethers.Contract(contractAddress, ERC721_ABI, this.provider);
  }

  async getNFTInfo({
    contractAddress,
    tokenId,
    walletId = null
  }: {
    contractAddress: string;
    tokenId: number | string;
    walletId?: string | null;
  }): Promise<NFTData> {
    const result = await this.getNftContract(contractAddress).tokenURI(tokenId);

    const resultSource = await result.replace('ipfs://', 'https://ipfs.io/ipfs/');

    const data = await GET<IpfsNft>(resultSource);

    return mapNFTData(
      {
        ...data,
        contractAddress,
        tokenId
      },
      walletId,
      this.chainId
    );
  }

  async getUserNfts({ walletAddress, walletId }: { walletAddress: string; walletId?: string }): Promise<NFTData[]> {
    return GET<BlockExplorerNftTransactionResponse>(`${this.blockExplorerUrl}/api`, {
      module: 'account',
      action: 'tokennfttx',
      address: walletAddress
    }).then(async (transactions) => {
      const ownedNfts: Record<string, BlockExplorerNft> = {};

      if (!Array.isArray(transactions.result)) {
        throw new InvalidInputError(`Error from ZKSync block explorer: ${transactions.message} ${transactions.result}`);
      }

      const sortedTransactions = transactions.result.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

      sortedTransactions.forEach((tx) => {
        const tokenId = tx.tokenID;
        if (!lowerCaseEqual(tx.to, walletAddress)) {
          // User transferred the NFT away
          delete ownedNfts[tokenId];
        } else {
          // User received the NFT
          ownedNfts[tokenId] = tx;
        }
      });

      const userNfts = await Promise.all(
        Object.values(ownedNfts).map((nft) =>
          this.getNFTInfo({ contractAddress: nft.contractAddress, tokenId: nft.tokenID, walletId })
        )
      );

      return userNfts;
    });
  }
}
const zkMainnetClient = new ZkSyncApiClient({ chainId: zkSync.id });
const zkTestnetClient = new ZkSyncApiClient({ chainId: zkSyncTestnet.id });

export function getClient({ chainId }: { chainId: SupportedChainId }) {
  if (!supportedNetworks.includes(chainId)) {
    throw new Error(`Unsupported chain id: ${chainId}`);
  }

  return chainId === zkSync.id ? zkMainnetClient : zkTestnetClient;
}

function mapNFTData(
  token: IpfsNft & { contractAddress: string; tokenId: number | string },
  walletId: string | null = null,
  chainId: SupportedChainId = zkSync.id
): NFTData {
  const tokenUriDNSVersion = token.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '';
  return {
    id: `${token.contractAddress}:${token.tokenId}`,
    tokenId: String(token.tokenId),
    tokenIdInt: Number(token.tokenId),
    contract: token.contractAddress,
    imageRaw: tokenUriDNSVersion,
    image: tokenUriDNSVersion,
    imageThumb: tokenUriDNSVersion,
    title: token.name || '',
    description: token.description || '',
    chainId,
    timeLastUpdated: new Date(1970).toISOString(),
    isHidden: false,
    isPinned: false,
    link: '',
    walletId
  };
}
