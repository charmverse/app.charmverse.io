/* eslint-disable class-methods-use-this */

import { Block, Space, InviteLink, Prisma, Page, User, Bounty, Application, BountyStatus } from '@prisma/client';
import * as http from 'adapters/http';
import { Contributor, LoggedInUser, BountyWithApplications } from 'models';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';
import type { ServerBlockFields } from 'pages/api/blocks';
import { getDisplayName } from 'lib/users';
import { Block as FBBlock, BlockPatch } from 'components/databases/focalboard/src/blocks/block';
import { IUser, UserWorkspace } from 'components/databases/focalboard/src/user';
import { IWorkspace } from 'components/databases/focalboard/src/blocks/workspace';
import { OctoUtils } from 'components/databases/focalboard/src/octoUtils';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import { CryptoCurrency, FiatCurrency, IPairQuote } from 'models/Currency';

type BlockUpdater = (blocks: FBBlock[]) => void;

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

  getContributors (spaceId: string) {
    return http.GET<Contributor[]>(`/api/spaces/${spaceId}/contributors`);
  }

  updateContributor ({ spaceId, userId, role }: { spaceId: string, userId: string, role: string }) {
    return http.PUT<Contributor[]>(`/api/spaces/${spaceId}/contributors/${userId}`, { role });
  }

  removeContributor ({ spaceId, userId }: { spaceId: string, userId: string }) {
    return http.DELETE<Contributor[]>(`/api/spaces/${spaceId}/contributors/${userId}`);
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

  getPublicPage (pageId: string) {
    return http.GET<Page>(`/api/public/pages/${pageId}`);
  }

  togglePagePublicAccess (pageId: string, publiclyAccessible: boolean) {
    return http.PUT<Page>(`/api/pages/${pageId}`, { isPublic: publiclyAccessible });
  }

  createInviteLink (link: Partial<InviteLink>) {
    return http.POST<InviteLinkPopulated[]>('/api/invites', link);
  }

  deleteInviteLink (linkId: string) {
    return http.DELETE<InviteLinkPopulated[]>(`/api/invites/${linkId}`);
  }

  getInviteLinks (spaceId: string) {
    return http.GET<InviteLinkPopulated[]>('/api/invites', { spaceId });
  }

  acceptInvite ({ id }: { id: string }) {
    return http.POST<InviteLinkPopulated[]>(`/api/invites/${id}`);
  }

  // FocalBoard

  // TODO: we shouldnt have to ask the server for the current space, but it will take time to pass spaceId through focalboard!

  async getWorkspace (): Promise<IWorkspace> {
    const space = await http.GET<Space>('/api/spaces/current');
    if (!space) {
      throw new Error('No workspace found');
    }
    return {
      id: space.id,
      title: space.name,
      signupToken: '',
      settings: {},
      updatedBy: space.updatedBy,
      updatedAt: space.updatedAt ? new Date(space.updatedAt).getTime() : 0
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
    const currentSpace = await this.getWorkspace();
    const contributors = await this.getContributors(currentSpace.id);
    return contributors.map(this.userToFBUser);
  }

  async getAllBlocks (): Promise<FBBlock[]> {
    return http.GET<Block[]>('/api/blocks')
      .then(blocks => blocks.map(this.blockToFBBlock))
      .then(blocks => this.fixBlocks(blocks));
  }

  getSubtree (rootId?: string, levels = 2): Promise<FBBlock[]> {
    return http.GET<Block[]>(`/api/blocks/${rootId}/subtree`, { levels })
      .then(blocks => blocks.map(this.blockToFBBlock))
      .then(blocks => this.fixBlocks(blocks));
  }

  fixBlocks (blocks: FBBlock[]): FBBlock[] {
    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);
    return fixedBlocks;
  }

  private blockToFBBlock (block: Block): FBBlock {
    return {
      ...block,
      deleteAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
      createdAt: new Date(block.createdAt).getTime(),
      updatedAt: new Date(block.updatedAt).getTime(),
      type: block.type as FBBlock['type'],
      fields: block.fields as FBBlock['fields']
    };
  }

  private fbBlockToBlock (fbBlock: FBBlock): Omit<Block, ServerBlockFields> {
    return {
      id: fbBlock.id,
      parentId: fbBlock.parentId,
      rootId: fbBlock.rootId,
      schema: fbBlock.schema,
      type: fbBlock.type,
      title: fbBlock.title,
      fields: fbBlock.fields,
      deletedAt: fbBlock.deleteAt === 0 ? null : new Date(fbBlock.deleteAt),
      createdAt: (!fbBlock.createdAt || fbBlock.createdAt === 0) ? new Date() : new Date(fbBlock.createdAt),
      updatedAt: (!fbBlock.updatedAt || fbBlock.updatedAt === 0) ? new Date() : new Date(fbBlock.updatedAt)
    };
  }

  private userToFBUser (user: User): IUser {
    return {
      id: user.id,
      username: getDisplayName(user),
      email: '',
      props: {},
      create_at: new Date(user.createdAt).getTime(),
      update_at: new Date(user.updatedAt).getTime(),
      is_bot: false
    };
  }

  async insertBlock (block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock (blockId: string, updater: BlockUpdater): Promise<void> {
    const deletedBlock = await http.DELETE<Block>(`/api/blocks/${blockId}`);
    const fbBlock = this.blockToFBBlock(deletedBlock);
    fbBlock.deleteAt = new Date().getTime();
    updater([fbBlock]);
  }

  async insertBlocks (fbBlocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> {
    const blocksInput = fbBlocks.map(this.fbBlockToBlock);
    const newBlocks = await http.POST<Block[]>('/api/blocks', blocksInput);
    const newFBBlocks = newBlocks.map(this.blockToFBBlock);
    updater(newFBBlocks);
    return newFBBlocks;
  }

  async patchBlock (blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> {
    const currentBlocks = await http.GET<Block[]>('/api/blocks', { id: blockId });
    const currentFBBlock = this.blockToFBBlock(currentBlocks[0]);
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...currentFBBlock.fields as object, ...updatedFields }
    });
    deletedFields.forEach(field => delete fbBlockInput.fields[field]);
    const blockInput = this.fbBlockToBlock(fbBlockInput);
    const updatedBlocks = await http.PUT<Block[]>('/api/blocks', [blockInput]);
    const fbBlock = this.blockToFBBlock(updatedBlocks[0]);
    updater([fbBlock]);
  }

  async patchBlocks (_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> {
    const updatedBlockInput = _blocks.map((currentFBBlock, i) => {
      const { deletedFields = [], updatedFields = {}, ...updates } = blockPatches[i];
      const fbBlockInput = Object.assign(currentFBBlock, updates, {
        fields: { ...currentFBBlock.fields as object, ...updatedFields }
      });
      deletedFields.forEach(field => delete fbBlockInput.fields[field]);
      return this.fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await http.PUT<Block[]>('/api/blocks', updatedBlockInput);
    const fbBlocks = updatedBlocks.map(this.blockToFBBlock);
    updater(fbBlocks);
  }

  listBounties (spaceId: string): Promise<Bounty []> {
    return http.GET<Bounty[]>('/api/bounties', { spaceId });
  }

  async createBounty (bounty: Partial<Bounty>): Promise<Bounty> {

    const data = await http.POST<Bounty>('/api/bounties', bounty);

    return data;
  }

  async getBounty (bountyId: string): Promise<BountyWithApplications> {

    const data = await http.GET<BountyWithApplications>(`/api/bounties/${bountyId}`);

    return data;
  }

  async assignBounty (bountyId: string, assignee: string): Promise<BountyWithApplications> {

    const data = await http.PUT<BountyWithApplications>(`/api/bounties/${bountyId}`, {
      assignee,
      status: 'assigned',
      updatedAt: new Date()
    });

    return data;
  }

  async updateBounty (bountyId: string, bounty: Partial<Bounty>): Promise<BountyWithApplications> {

    const data = await http.PUT<BountyWithApplications>(`/api/bounties/${bountyId}`, bounty);

    return data;
  }

  async changeBountyStatus (bountyId: string, newStatus: BountyStatus): Promise<BountyWithApplications> {

    const data = await http.PUT<BountyWithApplications>(`/api/bounties/${bountyId}`, {
      status: newStatus
    });

    return data;
  }

  async createApplication (proposal: Application): Promise<Application> {

    const data = await http.POST<Application>('/api/applications', proposal);

    return data;
  }

  async listApplications (bountyId: string): Promise<Application []> {

    const data = await http.GET<Application []>('/api/applications', { bountyId });

    return data;
  }

  async getPricing (base: CryptoCurrency, quote: FiatCurrency): Promise<IPairQuote> {

    const data = await http.GET<IPairQuote>('/api/crypto-price', { base, quote });

    return data;
  }

  // AWS
  uploadToS3 (file: File): Promise<{ token: any, bucket: string, key: string, region: string }> {
    const filename = encodeURIComponent(file.name);
    return http.GET('/api/aws/s3-upload', { filename });
  }

  deleteFromS3 (src: string) {
    return http.DELETE('/api/aws/s3-delete', { src });
  }
}

const charmClient = new CharmClient();

export default charmClient;
