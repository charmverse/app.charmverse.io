/* eslint-disable class-methods-use-this */
import * as seedData from 'seedData';
import { getStorageValue, setStorageValue } from 'hooks/useLocalStorage';
import { Space } from 'models';
import { Block, BlockPatch } from './focalboard/src/blocks/block';
import { IUser, UserWorkspace } from './focalboard/src/user';
import { IWorkspace } from './focalboard/src/blocks/workspace';
import { OctoUtils } from './focalboard/src/octoUtils';
import { Utils } from './focalboard/src/utils';

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {

  // Workspace

  private getCurrentWorkspace (): Space {
    const spaces = getStorageValue<Space[]>('spaces', seedData.spaces);
    const currentSpace = spaces.find(space => window.location.pathname.includes(space.domain));
    if (!currentSpace) {
      throw new Error(`Could not find space by URL: ${window.location.pathname}`);
    }
    return currentSpace;
  }

  async getWorkspace (): Promise<IWorkspace> {
    const currentSpace = this.getCurrentWorkspace();
    return {
      id: currentSpace.id,
      title: currentSpace.name,
      signupToken: '',
      settings: {}
    };
  }

  async getAllBlocks (): Promise<Block[]> {
    const blocks = getStorageValue('database-blocks', [...seedData.blocks]);
    return this.fixBlocks(blocks);
  }

  fixBlocks (blocks: Block[]): Block[] {
    if (!blocks) {
      return [];
    }

    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);

    return fixedBlocks;
  }

  async getWorkspaceUsers (): Promise<IUser[]> {
    return [];
  }

  async patchBlock (blockId: string, blockPatch: BlockPatch): Promise<void> {
    Utils.log(`patchBlock: ${blockId} block`);
    const blocks = getStorageValue('database-blocks', [...seedData.blocks]);
    const block = blocks.find(b => b.id === blockId);
    const { updatedFields = {}, ...updates } = blockPatch;
    Object.assign(block, updates, updatedFields);
    setStorageValue('database-blocks', blocks);
  }

  async patchBlocks (_blocks: Block[], blockPatches: BlockPatch[]): Promise<void> {
    Utils.log(`patchBlocks: ${_blocks.length} blocks`);
    const blocks = getStorageValue('database-blocks', [...seedData.blocks]);
    _blocks.forEach((block, i) => {
      const blockPatch = blockPatches[i]!;
      const { updatedFields = {}, ...updates } = blockPatch;
      Object.assign(block, updates, updatedFields);
    });
    setStorageValue('database-blocks', blocks);
  }

  async deleteBlock (blockId: string): Promise<void> {
    Utils.log(`deleteBlock: ${blockId}`);
    const blocks = getStorageValue('database-blocks', [...seedData.blocks]);
    setStorageValue('database-blocks', blocks.filter(block => block.id !== blockId));
  }

  async insertBlock (block: Block): Promise<Block[]> {
    return this.insertBlocks([block]);
  }

  async insertBlocks (newBlocks: Block[]): Promise<Block[]> {
    Utils.log(`insertBlocks: ${newBlocks.length} blocks(s)`);
    const blocks = getStorageValue('database-blocks', [...seedData.blocks]);
    const currentSpace = this.getCurrentWorkspace();
    newBlocks.forEach(block => {
      block.workspaceId = currentSpace.id;
    });
    setStorageValue('database-blocks', [...blocks, ...newBlocks]);
    return newBlocks;
  }

  async getUserWorkspaces (): Promise<UserWorkspace[]> {
    const spaces = getStorageValue<Space[]>('spaces', seedData.spaces);
    return spaces.map(space => ({
      id: space.id,
      title: space.name,
      boardCount: 0
    }));
  }

}

const charmClient = new CharmClient();

export default charmClient;
