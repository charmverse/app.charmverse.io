/* eslint-disable class-methods-use-this */

import { Block, Space, Prisma, Page } from '@prisma/client';
import * as http from 'adapters/http';
import { Contributor, LoggedInUser } from 'models';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';
import { Block as FBBlock, BlockPatch } from 'components/databases/focalboard/src/blocks/block';
import { IUser, UserWorkspace } from 'components/databases/focalboard/src/user';
import { OctoUtils } from 'components/databases/focalboard/src/octoUtils';

type BlockUpdater = (blocks: FBBlock[]) => void;

type ServerFields = 'spaceId' | 'updatedBy' | 'createdBy';

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {

  async login (address: string) {
    const user = await http.POST<LoggedInUser>('/api/session/login', {
      address
    });
    return user;
  }

  async logout () {
    await http.POST('/api/session/logout');
  }

  getUser () {
    return http.GET<LoggedInUser>('/api/profile');
  }

  createUser ({ address }: { address: string }) {
    return http.POST<LoggedInUser>('/api/profile', {
      address
    });
  }

  async createSpace (spaceOpts: Prisma.SpaceCreateInput) {
    const space = await http.POST<Space>('/api/spaces', spaceOpts);
    return space;
  }

  deleteSpace (spaceId: string) {
    return http.DELETE(`/api/spaces/${spaceId}`);
  }

  updateSpace (spaceOpts: Prisma.SpaceUpdateInput) {
    return http.PUT<Space>(`/api/spaces/${spaceOpts.id}`, spaceOpts);
  }

  getSpaces () {
    return http.GET<Space[]>('/api/spaces');
  }

  checkDomain (params: { spaceId?: string, domain: string }) {
    return http.GET<CheckDomainResponse>('/api/spaces/checkDomain', params);
  }

  getPages (spaceId: string) {
    return http.GET<Page[]>(`/api/spaces/${spaceId}/pages`);
  }

  createPage (pageOpts: Prisma.PageCreateInput) {
    return http.POST<Page>('/api/pages', pageOpts);
  }

  deletePage (pageId: string) {
    return http.DELETE(`/api/pages/${pageId}`);
  }

  updatePage (pageOpts: Prisma.PageUpdateInput) {
    return http.PUT<Page>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  favoritePage (pageId: string) {
    return http.POST('/api/profile/favorites', { pageId });
  }

  unfavoritePage (pageId: string) {
    return http.DELETE('/api/profile/favorites', { pageId });
  }

  // FocalBoard

  async getWorkspace (): Promise<UserWorkspace> {
    const space = await http.GET<Space>('/api/spaces/current');
    if (!space) {
      throw new Error('No workspace found');
    }
    return {
      id: space.id,
      title: space.name,
      boardCount: 0
    };
  }

  async getUserWorkspaces (): Promise<UserWorkspace[]> {
    const spaces = await this.getSpaces();
    return spaces.map(space => ({
      id: space.id,
      title: space.name,
      boardCount: 0
    }));
  }

  async getWorkspaceUsers (): Promise<IUser[]> {
    return [];
  }

  async getAllBlocks (): Promise<FBBlock[]> {
    return http.GET<Block[]>('/api/blocks')
      .then(blocks => blocks.map((block): FBBlock => ({
        ...block,
        deleteAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
        createdAt: new Date(block.createdAt).getTime(),
        updatedAt: new Date(block.updatedAt).getTime(),
        type: block.type as FBBlock['type'],
        fields: block.fields as FBBlock['fields']
      })))
      .then(blocks => this.fixBlocks(blocks));
  }

  fixBlocks (blocks: FBBlock[]): FBBlock[] {
    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);

    return fixedBlocks;
  }

  async insertBlock (block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock (blockId: string, updater: BlockUpdater): Promise<FBBlock[]> {
    await http.DELETE(`/api/blocks/${blockId}`);
    const ffBlocks = await this.getAllBlocks();
    updater(ffBlocks);
    return ffBlocks;
  }

  async insertBlocks (blocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> {
    const blocksWithSpace = blocks.map((block): Omit<Block, ServerFields> => {
      return {
        id: block.id,
        parentId: block.parentId,
        rootId: block.rootId,
        schema: block.schema,
        type: block.type,
        title: block.title,
        fields: block.fields,
        deletedAt: block.deleteAt === 0 ? null : new Date(block.deleteAt),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    await http.POST<Block[]>('/api/blocks', blocksWithSpace);
    const ffBlocks = await this.getAllBlocks();
    updater(ffBlocks);
    return ffBlocks;
  }

  async patchBlock (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> {
    console.log('patchBlock', blockPatch);
  }

  async patchBlocks (_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> {
    console.log('patchBlocks', _blocks);
  }

  getContributors (spaceId: string) {
    return http.GET<Contributor[]>(`/api/spaces/${spaceId}/contributors`);
  }

}

const charmClient = new CharmClient();

export default charmClient;
