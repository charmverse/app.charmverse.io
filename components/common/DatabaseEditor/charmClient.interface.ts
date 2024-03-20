import type { Block, BlockPatch } from 'lib/databases/block';

export type BlockUpdater = (blocks: Block[]) => void;

export interface ICharmClient {
  patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void>;
  patchBlocks(_blocks: Block[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void>;
  deleteBlock(blockId: string, updater: BlockUpdater): Promise<void>;
  insertBlock(block: Block, updater: BlockUpdater): Promise<Block[]>;
  insertBlocks(newBlocks: Block[], updater: BlockUpdater): Promise<Block[]>;
}
