import { useEffect } from 'react';

import type { BlockUpdater } from 'components/common/BoardEditor/charmClient.interface';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useRewardsBoard } from 'components/rewards/hooks/useRewardsBoard';
import { useRewardBlocks } from 'hooks/useRewardBlocks';
import type { BlockPatch, Block as FBBlock } from 'lib/focalboard/block';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { RewardBlockWithTypedFields, RewardPropertyValues } from 'lib/rewards/blocks/interfaces';

export function useRewardsBoardMutator() {
  const { updateBlock, createBlock, getBlock, updateBlocks } = useRewardBlocks();
  const { activeView } = useRewardsBoard();
  const { rewards, updateReward } = useRewards();

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
        currentBlock = await createBlock(fbBlockToBlock(activeView) as unknown as RewardBlockWithTypedFields);
      }
    }

    if (!currentBlock) return;

    const currentFBBlock = blockToFBBlock(currentBlock);
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });

    // delete local fields before saving
    delete fbBlockInput.fields.localSortOptions;
    delete fbBlockInput.fields.localFilter;

    if (fbBlockInput.fields.cardProperties) {
      fbBlockInput.fields.cardProperties = fbBlockInput.fields.cardProperties.filter(
        (p: IPropertyTemplate) => !p.id.startsWith('__')
      );
    }
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const blockInput = fbBlockToBlock(fbBlockInput);

    const updatedBlock = await updateBlock(blockInput as RewardBlockWithTypedFields);
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
          (p: IPropertyTemplate) => !p.id.startsWith('__')
        );
      }
      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await updateBlocks(updatedBlockInput as RewardBlockWithTypedFields[]);
    if (!updatedBlocks) return;

    const fbBlocks = updatedBlocks.map(blockToFBBlock) || [];
    updater(fbBlocks);
  };

  useEffect(() => {
    // override default mutator updaters
    mutator.setCustomMutatorUpdaters({ patchBlock, patchBlocks });

    // restore default mutator updaters on unmount
    return () => mutator.setCustomMutatorUpdaters(null);
  });
}
