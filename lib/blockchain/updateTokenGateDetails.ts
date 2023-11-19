import type { UnifiedAccessControlConditions } from '@lit-protocol/types';
import { getChainById } from 'connectors/chains';

import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { LIT_CHAINS } from 'lib/tokenGates/utils';
import { getTokenMetadata } from 'lib/tokens/getTokenMetadata';

import { getNFT } from './getNFTs';

export async function updateTokenGateDetails(tokenGates: TokenGateWithRoles[] | undefined = []) {
  const updatedTokenGates = await Promise.all(
    tokenGates.map(async (gate) => {
      const gateConditions = gate.conditions as any;
      const unifiedAccessControlConditions =
        gateConditions && 'unifiedAccessControlConditions' in gateConditions
          ? (gateConditions.unifiedAccessControlConditions as UnifiedAccessControlConditions)
          : [];

      const unifiedConditions = await Promise.all(
        unifiedAccessControlConditions.map(async (condition) => {
          const isNft = 'standardContractType' in condition && condition.standardContractType === 'ERC721';
          const isCustomToken = 'standardContractType' in condition && condition.standardContractType === 'ERC20';

          if (isNft) {
            const hasTokenId = !!condition.parameters[0] && Number(condition.parameters[0]) >= 0;
            const tokenId = hasTokenId ? String(condition.parameters[0]) : '1';
            const chainDetails = getChainById(LIT_CHAINS[condition.chain].chainId);

            const nft = await getNFT({
              address: condition.contractAddress || '',
              tokenId,
              chainId: LIT_CHAINS[condition.chain].chainId
            });

            if (nft) {
              const nftName = nft.title || nft.contractName;
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
