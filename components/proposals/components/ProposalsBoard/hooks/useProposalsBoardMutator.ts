import { useEffect } from 'react';

import type { BlockUpdater } from 'components/common/BoardEditor/charmClient.interface';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockPatch, Block as FBBlock } from 'lib/focalboard/block';
import type { ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';

export function useProposalsBoardMutator() {
  const { updateBlock, createBlock, getBlock, updateBlocks } = useProposalBlocks();
  const { activeView } = useProposalsBoard();

  const patchBlock = async (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> => {
    let currentBlock = await getBlock(blockId);

    if (!currentBlock) {
      // if updating default view for the first time - create it in db
      if (blockId === '__defaultView') {
        currentBlock = await createBlock(fbBlockToBlock(activeView) as unknown as ProposalBlockWithTypedFields);
      }
    }

    if (!currentBlock) return;

    const currentFBBlock = blockToFBBlock(currentBlock);
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const blockInput = fbBlockToBlock(fbBlockInput);

    const updatedBlock = await updateBlock(blockInput as ProposalBlockWithTypedFields);
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
      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await updateBlocks(updatedBlockInput as ProposalBlockWithTypedFields[]);
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
