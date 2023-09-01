import type { BlockUpdater } from 'components/common/BoardEditor/charmClient.interface';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/BoardEditor/utils/blockUtils';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockPatch } from 'lib/focalboard/block';
import type { ProposalBlockWithTypedFields } from 'lib/proposal/blocks/interfaces';

export function useProposalsBoardMutator() {
  const { updateBlock, getBlock } = useProposalBlocks();

  const patchBlock = async (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> => {
    const currentBlock = await getBlock(blockId);
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

  return null;
}
