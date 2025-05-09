import { useEffect } from 'react';

import type { BlockUpdater } from 'components/common/DatabaseEditor/charmClient.interface';
import mutator from 'components/common/DatabaseEditor/mutator';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { useRewardBlocks } from 'components/rewards/hooks/useRewardBlocks';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsBoardAndBlocks } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { usePages } from 'hooks/usePages';
import type { BlockPatch, UIBlockWithDetails as FBBlock } from '@packages/databases/block';
import type { IPropertyTemplate } from '@packages/databases/board';
import { Constants } from '@packages/databases/constants';
import type { RewardBlockInput, RewardBlockUpdateInput } from '@packages/lib/rewards/blocks/interfaces';

export function useRewardsBoardMutator() {
  const {
    updateBlock,
    createBlock,
    getBlock,
    updateBlocks,
    createBlocks,
    deleteBlocks: deleteRewardBlocks,
    deleteBlock: deleteRewardBlock
  } = useRewardBlocks();
  const { activeView } = useRewardsBoardAndBlocks();
  const { rewards, updateReward } = useRewards();
  const { pages, deletePage } = usePages();

  const patchBlock = async (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> => {
    const rewardToUpdate = rewards?.find((p) => p.id === blockId);
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;

    if (rewardToUpdate) {
      // updating reward block - update reward fields instead
      const currentFields = (rewardToUpdate.fields as object) || {};
      const fields = { ...currentFields, ...updatedFields };
      deletedFields.forEach((field) => delete fields[field]);

      await updateReward({ rewardId: blockId, updateContent: { fields: fields as any } });

      return;
    }

    let currentBlock = await getBlock(blockId);

    if (!currentBlock) {
      // if updating default view for the first time - create it in db
      if (blockId === '__defaultView') {
        currentBlock = await createBlock(fbBlockToBlock(activeView) as unknown as RewardBlockInput);
      }
    }

    if (!currentBlock) return;

    const currentFBBlock = blockToFBBlock(currentBlock);
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });

    if (fbBlockInput.fields.cardProperties) {
      fbBlockInput.fields.cardProperties = fbBlockInput.fields.cardProperties.filter(
        (p: IPropertyTemplate) => !p.id.startsWith('__') || p.id === Constants.titleColumnId
      );
    }
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const blockInput = fbBlockToBlock(fbBlockInput);

    const updatedBlock = await updateBlock(blockInput as unknown as RewardBlockUpdateInput);
    if (!updatedBlock) return;

    const fbBlock = blockToFBBlock(updatedBlock);
    updater([fbBlock]);
  };

  const patchBlocks = async (_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> => {
    const updatedBlockInput = _blocks.map((currentFBBlock, i) => {
      const { deletedFields = [], updatedFields = {}, ...updates } = blockPatches[i];
      const fbBlockInput = Object.assign(currentFBBlock, updates, {
        fields: { ...(currentFBBlock.fields as object), ...updatedFields }
      });

      if (fbBlockInput.fields.cardProperties) {
        fbBlockInput.fields.cardProperties = fbBlockInput.fields.cardProperties.filter(
          (p: IPropertyTemplate) => !p.id.startsWith('__') || p.id === Constants.titleColumnId
        );
      }
      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return fbBlockToBlock(fbBlockInput);
    });

    const updatedBlocks = await updateBlocks(updatedBlockInput as unknown as RewardBlockUpdateInput[]);
    if (!updatedBlocks) return;

    const fbBlocks = updatedBlocks.map(blockToFBBlock) || [];
    updater(fbBlocks);
  };

  const insertBlocks = async (fbBlocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> => {
    const blocksInput = fbBlocks.map(fbBlockToBlock);
    const newBlocks = await createBlocks(blocksInput as unknown as RewardBlockInput[]);

    if (!newBlocks) return [];

    const newFBBlocks = newBlocks.map(blockToFBBlock);
    updater(newFBBlocks);

    return newFBBlocks;
  };

  const deleteBlocks = async (blockIds: string[], updater: BlockUpdater): Promise<void> => {
    const rootBlocks = await deleteRewardBlocks(blockIds);
    if (!rootBlocks) return;

    const fbBlocks = rootBlocks.map((rootBlock) => ({
      ...blockToFBBlock(rootBlock),
      deletedAt: new Date().getTime()
    }));
    updater(fbBlocks);
  };

  const insertBlock = async (fbBlock: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> => {
    return insertBlocks([fbBlock], updater);
  };

  const deleteBlock = async (blockId: string, updater: BlockUpdater): Promise<void> => {
    if (pages[blockId]?.type === 'bounty') {
      await deletePage({ pageId: blockId });
      return;
    }

    const rootBlock = await deleteRewardBlock(blockId);
    if (!rootBlock) return;

    const fbBlock = blockToFBBlock(rootBlock);
    fbBlock.deletedAt = new Date().getTime();
    updater([fbBlock]);
  };

  useEffect(() => {
    // override default mutator updaters
    mutator.setCustomMutatorUpdaters({ patchBlock, patchBlocks, insertBlock, insertBlocks, deleteBlocks, deleteBlock });

    // restore default mutator updaters on unmount
    return () => mutator.setCustomMutatorUpdaters(null);
  }, []);
}
