import { getChainById } from '@packages/blockchain/connectors/chains';
import { getGuildDetails } from '@packages/lib/guild-xyz/getGuild';
import { getHypersubDetails } from '@packages/lib/tokenGates/hypersub/getHypersubDetails';
import type { AccessControlCondition, TokenGate } from '@packages/lib/tokenGates/interfaces';
import { getLockMetadata } from '@packages/lib/tokenGates/unlock/getLockMetadata';
import { getTokenMetadata } from '@packages/lib/tokens/getTokenMetadata';
import { handleAllSettled } from '@packages/lib/utils/async';

import { getNFT } from './getNFTs';
import { getPoapByEventId } from './poaps';

export async function updateTokenGateDetails<T extends TokenGate>(tokenGates: T[] = []): Promise<T[]> {
  const updatedTokenGates = await Promise.allSettled(tokenGates.map(getConditionMetadata)).then(handleAllSettled);
  return updatedTokenGates;
}

async function getConditionMetadata<T extends TokenGate>(gate: T): Promise<T> {
  const gateConditions = gate.conditions;
  const initialAccessControlConditions = gateConditions?.accessControlConditions || [];
  const accessControlConditions = await Promise.all(initialAccessControlConditions?.map(getAccessControlMetaData));

  return { ...gate, conditions: { ...gateConditions, accessControlConditions } };
}

async function getAccessControlMetaData(condition: AccessControlCondition) {
  const chainDetails = getChainById(condition.chain);

  switch (condition.type) {
    case 'Builder':
    case 'Hats':
    case 'ERC721':
    case 'ERC1155': {
      const tokenId = BigInt(condition.tokenIds.at(0) || '1').toString();
      const nft = await getNFT({
        address: condition.contractAddress,
        tokenId,
        chainId: condition.chain
      });
      const nftName = nft?.contractName || nft?.title;
      const nftImage = nft?.image || chainDetails?.iconUrl || chainDetails?.nativeCurrency?.logoURI;

      return {
        ...condition,
        name: nftName,
        image: nftImage
      };
    }
    case 'ERC20': {
      if (condition.contractAddress) {
        const tokenMetaData = await getTokenMetadata({
          chainId: condition.chain,
          contractAddress: condition.contractAddress || ''
        }).catch((_err) => null);

        return { ...condition, name: tokenMetaData?.name, image: tokenMetaData?.logo };
      } else {
        return {
          ...condition,
          name: chainDetails?.chainName,
          image: chainDetails?.iconUrl || chainDetails?.nativeCurrency?.logoURI
        };
      }
    }
    case 'Hypersub': {
      const hyperSubCondition = await getHypersubDetails(condition).catch((_err) => null);
      return { ...condition, name: hyperSubCondition?.name, image: hyperSubCondition?.image };
    }
    case 'Unlock': {
      const unlockProtocolMetadata = await getLockMetadata({
        contract: condition.contractAddress,
        chainId: condition.chain
      }).catch((_err) => null);
      return { ...condition, image: unlockProtocolMetadata?.image, name: unlockProtocolMetadata?.name };
    }
    case 'POAP': {
      const poapDetails = await getPoapByEventId(condition.tokenIds.at(0) || '').catch((_err) => null);
      return { ...condition, name: poapDetails?.name, image: poapDetails?.image_url || '/images/logos/poap_logo.svg' };
    }
    case 'Guildxyz': {
      const tokenIdOrUrl = condition.tokenIds.at(0) || '';
      const guildDetails = await getGuildDetails(tokenIdOrUrl).catch((_err) => null);
      const guildId = guildDetails?.id ? String(guildDetails?.id) : tokenIdOrUrl;
      return {
        ...condition,
        tokenIds: [guildId],
        name: guildDetails?.name,
        image: guildDetails?.imageUrl || '/images/logos/guild_logo.svg'
      };
    }
    case 'GitcoinPassport': {
      return { ...condition, image: '/images/logos/gitcoin_passport.svg' };
    }
    case 'MolochDAOv2.1':
    case 'Wallet':
    default: {
      return { ...condition, image: chainDetails?.iconUrl };
    }
  }
}
