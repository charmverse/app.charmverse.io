import * as http from '@packages/adapters/http';

import type { BlockWithDetails, BlockPatch, UIBlockWithDetails as FBBlock } from './block';
import { blockToFBBlock, fbBlockToBlock, fixBlocks } from './utils/blockUtils';

type BlockUpdater = (blocks: FBBlock[]) => void;

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {
  getBlock({ blockId }: { blockId: string }) {
    return http.GET<BlockWithDetails>(`/api/blocks/${blockId}`).then(blockToFBBlock);
  }

  getSubtree({ pageId }: { pageId: string }) {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/subtree`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  getViews({ pageId }: { pageId: string }): Promise<FBBlock[]> {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/views`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  getComments({ pageId }: { pageId: string }): Promise<FBBlock[]> {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/comments`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  async insertBlock(block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock(blockId: string, updater: BlockUpdater): Promise<void> {
    const { rootBlock } = await http.DELETE<{ deletedCount: number; rootBlock: BlockWithDetails }>(
      `/api/blocks/${blockId}`
    );
    const fbBlock = blockToFBBlock(rootBlock);
    fbBlock.deletedAt = new Date().getTime();
    updater([fbBlock]);
  }

  async deleteBlocks(blockIds: string[], updater: BlockUpdater): Promise<void> {
    const rootBlocks = await http.DELETE<BlockWithDetails[]>(`/api/blocks`, { blockIds });
    const fbBlocks = rootBlocks.map((rootBlock) => ({
      ...blockToFBBlock(rootBlock),
      deletedAt: new Date().getTime()
    }));
    updater(fbBlocks);
  }

  async insertBlocks(fbBlocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> {
    const blocksInput = fbBlocks.map(fbBlockToBlock);
    const newBlocks = await http.POST<BlockWithDetails[]>('/api/blocks', blocksInput);
    const newFBBlocks = newBlocks.map(blockToFBBlock);
    updater(newFBBlocks);
    return newFBBlocks;
  }

  async patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> {
    const currentFBBlock: FBBlock = blockToFBBlock(await http.GET<BlockWithDetails>(`/api/blocks/${blockId}`));
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const { isLocked, ...blockInput } = fbBlockToBlock(fbBlockInput);
    const updatedBlocks = await http.PUT<BlockWithDetails[]>('/api/blocks', [blockInput]);
    const fbBlock = blockToFBBlock(updatedBlocks[0]);
    updater([fbBlock]);
  }

  async updateBlock(blockInput: FBBlock) {
    const newBlock = fbBlockToBlock(blockInput);
    return http.PUT<BlockWithDetails[]>('/api/blocks', [newBlock]);
  }

  async patchBlocks(_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> {
    const updatedBlockInput = _blocks.map((currentFBBlock, i) => {
      const { deletedFields = [], updatedFields = {}, ...updates } = blockPatches[i];
      const fbBlockInput = Object.assign(currentFBBlock, updates, {
        fields: { ...(currentFBBlock.fields as object), ...updatedFields }
      });

      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await http.PUT<BlockWithDetails[]>('/api/blocks', updatedBlockInput);
    const fbBlocks = updatedBlocks.map(blockToFBBlock);
    updater(fbBlocks);
  }

  getPage(pageId: string, spaceId?: string) {
    // return http.GET<PageWithContent>(`/api/pages/${pageId}`, { spaceId });
    return http.GET<any>(`/api/pages/${pageId}`, { spaceId });
  }
}

const charmClient = new CharmClient();

export default charmClient;
