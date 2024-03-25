import { useEffect } from 'react';

import type { BlockUpdater } from 'components/common/DatabaseEditor/charmClient.interface';
import mutator from 'components/common/DatabaseEditor/mutator';
import { blockToFBBlock, fbBlockToBlock } from 'components/common/DatabaseEditor/utils/blockUtils';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useProposalBlocks } from 'hooks/useProposalBlocks';
import type { BlockPatch, UIBlockWithDetails as FBBlock } from 'lib/databases/block';
import type { IPropertyTemplate } from 'lib/databases/board';
import type { ProposalBlockWithTypedFields, ProposalPropertyValues } from 'lib/proposals/blocks/interfaces';

export function useProposalsBoardMutator() {
  const { updateBlock, createBlock, getBlock, updateBlocks } = useProposalBlocks();
  const { activeView } = useProposalsBoard();
  const { proposals, updateProposal } = useProposals();

  const patchBlock = async (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> => {
    const proposalToUpdate = proposals?.find((p) => p.id === blockId);
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;

    if (proposalToUpdate) {
      // updating proposal block - update proposal fields instead
      const currentFields = (proposalToUpdate.fields as object) || {};
      const fields = { ...currentFields, ...updatedFields };
      deletedFields.forEach((field) => delete fields[field]);

      await updateProposal({ proposalId: blockId, fields: fields as ProposalPropertyValues });

      return;
    }

    let currentBlock = await getBlock(blockId);

    if (!currentBlock) {
      // if updating default view for the first time - create it in db
      if (blockId === '__defaultView') {
        currentBlock = await createBlock(fbBlockToBlock(activeView) as unknown as ProposalBlockWithTypedFields);
      }
    }

    if (!currentBlock) return;

    const currentFBBlock = blockToFBBlock(currentBlock);
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });

    if (fbBlockInput.fields.cardProperties) {
      fbBlockInput.fields.cardProperties = fbBlockInput.fields.cardProperties.filter(
        (p: IPropertyTemplate) => !p.id.startsWith('__')
      );
    }
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

      if (fbBlockInput.fields.cardProperties) {
        fbBlockInput.fields.cardProperties = fbBlockInput.fields.cardProperties.filter(
          (p: IPropertyTemplate) => !p.id.startsWith('__')
        );
      }
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
