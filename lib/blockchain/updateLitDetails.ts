import type { AccsDefaultParams } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { LitConditions } from 'lib/tokenGates/interfaces';
import { LIT_CHAINS } from 'lib/tokenGates/utils';
import { getTokenMetadata } from 'lib/tokens/getTokenMetadata';

import { getNFT } from './getNFTs';

export async function updateTokenGateLitDetails<T extends LitConditions>(
  tokenGates: T[] | undefined = []
): Promise<T[]> {
  const updatedTokenGates = await Promise.all(
    tokenGates.map(async (gate) => {
      const gateConditions = gate.conditions;
      const unifiedAccessControlConditions =
        gateConditions && 'unifiedAccessControlConditions' in gateConditions
          ? gateConditions.unifiedAccessControlConditions || []
          : [];

      const unifiedConditions = await Promise.all(
        unifiedAccessControlConditions.map(async (condition) => {
          const isNft =
            'standardContractType' in condition &&
            (condition.standardContractType === 'ERC721' || condition.standardContractType === 'ERC1155');

          const isCustomToken = 'standardContractType' in condition && condition.standardContractType === 'ERC20';

          if (isNft) {
            const tokenId = getTokenId(condition);

            const chainDetails = getChainById(LIT_CHAINS[condition.chain].chainId);

            const nft = await getNFT({
              address: condition.contractAddress || '',
              tokenId,
              chainId: LIT_CHAINS[condition.chain].chainId
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
              chainId: LIT_CHAINS[condition.chain].chainId,
              contractAddress: condition.contractAddress || ''
            });

            return { ...condition, name: tokenMetaData?.name, image: tokenMetaData?.logo };
          }

          if ('chain' in condition && condition.chain && LIT_CHAINS[condition.chain].chainId) {
            const chainDetails = getChainById(LIT_CHAINS[condition.chain].chainId);

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

function getTokenId(conditions: AccsDefaultParams) {
  switch (conditions.standardContractType) {
    case 'ERC721': {
      const parameter = conditions.parameters[0];
      const hasTokenId = !!parameter && Number(parameter) >= 0;

      return hasTokenId ? parameter : '1';
    }

    case 'ERC1155': {
      const parameter: string = conditions.parameters[1];
      const hasTokenId = !!parameter && Number(parameter) >= 0;

      return hasTokenId ? parameter : '1';
    }

    default:
      return '1';
  }
}
