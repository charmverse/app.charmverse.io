import { getChainById } from 'connectors/chains';

import type { AccessControlCondition, LitConditions } from 'lib/tokenGates/interfaces';
import { getTokenMetadata } from 'lib/tokens/getTokenMetadata';

import { getNFT } from './getNFTs';

export async function updateTokenGateLitDetails<T extends LitConditions>(
  tokenGates: T[] | undefined = []
): Promise<T[]> {
  const updatedTokenGates = await Promise.all(
    tokenGates.map(async (gate) => {
      const gateConditions = gate.conditions;
      const accessControlConditions = gateConditions.accessControlConditions;

      const unifiedConditions = await Promise.all(
        accessControlConditions.map(async (condition) => {
          const isNft =
            'standardContractType' in condition &&
            (condition.standardContractType === 'ERC721' || condition.standardContractType === 'ERC1155');

          const isCustomToken = 'standardContractType' in condition && condition.standardContractType === 'ERC20';

          if (isNft) {
            const tokenId = getTokenId(condition);

            const chainDetails = getChainById(condition.chain);

            const nft = await getNFT({
              address: condition.contractAddress || '',
              tokenId,
              chainId: condition.chain
            });

            if (nft) {
              const nftName = nft.contractName || nft.title;
              return {
                ...condition,
                name: nftName,
                image: nft.image
              };
            }

            return { ...condition, image: chainDetails?.iconUrl || chainDetails?.nativeCurrency?.logoURI };
          }

          if (isCustomToken) {
            const tokenMetaData = await getTokenMetadata({
              chainId: condition.chain,
              contractAddress: condition.contractAddress || ''
            });

            return { ...condition, name: tokenMetaData?.name, image: tokenMetaData?.logo };
          }

          if ('chain' in condition && condition.chain && condition.chain) {
            const chainDetails = getChainById(condition.chain);

            return { ...condition, image: chainDetails?.iconUrl || chainDetails?.nativeCurrency?.logoURI };
          }
          return condition;
        })
      );
      return { ...gate, conditions: { ...gateConditions, unifiedAccessControlConditions: unifiedConditions } };
    })
  );

  return updatedTokenGates;
}

// @TODO Need to support multiple tokenIds
function getTokenId(conditions: AccessControlCondition) {
  switch (conditions.type) {
    case 'ERC721': {
      const tokenId = conditions.tokenIds.at(0);
      const hasTokenId = !!tokenId && Number(tokenId) >= 0;

      return hasTokenId ? tokenId : '1';
    }

    case 'ERC1155': {
      const tokenIds = conditions.tokenIds;
      const hasTokenId = tokenIds.every((tId) => Number(tId) >= 0);

      return hasTokenId ? tokenIds[0] : '1';
    }

    default:
      return '1';
  }
}
