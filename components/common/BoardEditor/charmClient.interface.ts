import type { Block, BlockPatch } from './focalboard/src/blocks/block';
import type { IUser } from './focalboard/src/user';

export type BlockUpdater = (blocks: Block[]) => void;

export interface ICharmClient {
  getAllBlocks(): Promise<Block[]>;
  getWorkspaceUsers(): Promise<IUser[]>;
  patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void>;
  patchBlocks(_blocks: Block[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void>;
  deleteBlock(blockId: string, updater: BlockUpdater): Promise<void>;
  insertBlock(block: Block, updater: BlockUpdater): Promise<Block[]>;
  insertBlocks(newBlocks: Block[], updater: BlockUpdater): Promise<Block[]>;
}
