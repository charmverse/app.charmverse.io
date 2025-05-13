import type { UIBlockWithDetails, BlockPatch } from '@packages/databases/block';

export type BlockUpdater = (blocks: UIBlockWithDetails[]) => void;

export interface ICharmClient {
  patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void>;
  patchBlocks(_blocks: UIBlockWithDetails[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void>;
  deleteBlock(blockId: string, updater: BlockUpdater): Promise<void>;
  insertBlock(block: UIBlockWithDetails, updater: BlockUpdater): Promise<UIBlockWithDetails[]>;
  insertBlocks(newBlocks: UIBlockWithDetails[], updater: BlockUpdater): Promise<UIBlockWithDetails[]>;
}
