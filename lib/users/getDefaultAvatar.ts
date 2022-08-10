import { getUserS3Folder, uploadToS3 } from 'lib/aws/uploadToS3Server';
import { alchemyApi } from 'lib/blockchain/provider/alchemy';
import log from 'lib/log';
import { mapNftFromAlchemy } from 'lib/nft/utilities/mapNftFromAlchemy';
import { UserAvatar } from 'lib/users/interfaces';

const EMPTY_AVATAR: UserAvatar = {
  avatar: null,
  contractAddress: null,
  tokenId: null,
  tokenChain: null
};

export async function getDefaultAvatar (address: string, userId: string): Promise<UserAvatar> {
  const chainId = 1;
  const nfts = await alchemyApi.getNfts([address], chainId);

  if (nfts?.length) {
    const nft = mapNftFromAlchemy(nfts[0], chainId);
    try {
      const { url: avatar } = await uploadToS3({ fileName: getUserS3Folder({ userId, url: nft.image }), url: nft.image });

      return {
        avatar,
        contractAddress: nft.contract,
        tokenId: nft.tokenId,
        tokenChain: nft.chainId
      };
    }
    // eslint-disable-next-line no-empty
    catch (e) {
      log.debug('Failed to upload default NFT avatar', e);
    }
  }

  return EMPTY_AVATAR;
}

