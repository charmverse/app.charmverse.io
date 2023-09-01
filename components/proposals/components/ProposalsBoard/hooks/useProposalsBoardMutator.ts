import { useEffect } from 'react';

import type { BlockUpdater } from 'components/common/BoardEditor/charmClient.interface';
import mutator from 'components/common/BoardEditor/focalboard/src/mutator';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockPatch } from 'lib/focalboard/block';
import type { ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';

export function useProposalsBoardMutator() {
  const { updateBlock, createBlock, getBlock } = useProposalBlocks();
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

  useEffect(() => {
    // override default mutator updaters
    mutator.setCustomMutatorUpdaters({ patchBlock });

    // restore default mutator updaters on unmount
    return () => mutator.setCustomMutatorUpdaters(null);
  });
}
