/* eslint-disable class-methods-use-this */

import { Application, Block, Bounty, BountyStatus, InviteLink, Page, PagePermission, PaymentMethod, Prisma, Role, Space, TokenGate, Transaction, User, DiscordUser, TelegramUser } from '@prisma/client';
import * as http from 'adapters/http';
import { IPagePermissionFlags, IPagePermissionToCreate, IPagePermissionUpdate, IPagePermissionUserRequest, IPagePermissionWithAssignee } from 'lib/permissions/pages/page-permission-interfaces';
import { ITokenMetadata, ITokenMetadataRequest } from 'lib/tokens/tokenData';
import { getDisplayName } from 'lib/users';
import { BountyWithDetails, Contributor, LoggedInUser } from 'models';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';
import type { ServerBlockFields } from 'pages/api/blocks';
import { Block as FBBlock, BlockPatch } from 'components/common/BoardEditor/focalboard/src/blocks/block';
import { IUser, UserWorkspace } from 'components/common/BoardEditor/focalboard/src/user';
import { IWorkspace } from 'components/common/BoardEditor/focalboard/src/blocks/workspace';
import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import { FiatCurrency, IPairQuote } from 'models/Currency';
import type { FailedImportsError } from 'lib/notion/types';
import { ImportRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';
import { ConnectDiscordResponse } from 'pages/api/discord/connect';
import { TelegramAccount } from 'pages/api/telegram/connect';

type BlockUpdater = (blocks: FBBlock[]) => void;

export type ListSpaceRolesResponse = {
  id: string;
  name: string;
  spaceRolesToRole: {
      spaceRole: {
          user: User;
      };
  }[];
}

export interface PopulatedBounty extends Bounty {
  applications: Application[];
}

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

  updateUser ({ addresses }: { addresses?: string[] }) {
    return http.PUT<LoggedInUser>('/api/profile', { addresses });
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

  getPublicPageByViewId (viewId: string) {
    return http.GET<Page>(`/api/public/view/${viewId}`);
  }

  getBlockViewsByPageId (pageId: string) {
    return http.GET<Block []>(`/api/blocks/views/${pageId}`);
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
    return http.POST<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  unfavoritePage (pageId: string) {
    return http.DELETE<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  getPublicPage (pageId: string) {
    return http.GET<{pages: Page[], blocks: Block[]}>(`/api/public/pages/${pageId}`);
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

  importFromNotion (payload: { code: string, spaceId: string }) {
    return http.POST<{failedImports: FailedImportsError[]}>('/api/notion/import', payload);
  }

  connectTelegram (telegramAccount: TelegramAccount) {
    return http.POST<TelegramUser>('/api/telegram/connect', telegramAccount);
  }

  disconnectTelegram () {
    return http.POST('/api/telegram/disconnect');
  }

  disconnectDiscord () {
    return http.POST('/api/discord/disconnect');
  }

  connectDiscord (payload: { code: string }) {
    return http.POST<ConnectDiscordResponse>('/api/discord/connect', payload);
  }

  createAccountWithDiscord (payload: {code: string}) {
    return http.POST<ConnectDiscordResponse>('/api/discord/createAccount', payload);
  }

  importRolesFromDiscordServer (payload: ImportRolesPayload) {
    return http.POST<ImportRolesResponse>('/api/discord/importRoles', payload);
  }

  // FocalBoard

  // TODO: we shouldn't have to ask the server for the current space, but it will take time to pass spaceId through focalboard!

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
      deletedAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
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
      deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
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
      is_bot: false,
      wallet_address: user.addresses[0]
    };
  }

  async insertBlock (block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock (blockId: string, updater: BlockUpdater): Promise<void> {
    const deletedBlock = await http.DELETE<Block>(`/api/blocks/${blockId}`);
    const fbBlock = this.blockToFBBlock(deletedBlock);
    fbBlock.deletedAt = new Date().getTime();
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

  listBounties (spaceId: string): Promise<PopulatedBounty[]> {
    return http.GET('/api/bounties', { spaceId });
  }

  async createBounty (bounty: Partial<Bounty>): Promise<Bounty> {

    const data = await http.POST<Bounty>('/api/bounties', bounty);

    return data;
  }

  async getBounty (bountyId: string): Promise<BountyWithDetails> {

    const data = await http.GET<BountyWithDetails>(`/api/bounties/${bountyId}`);

    return data;
  }

  async deleteBounty (bountyId: string): Promise<any> {

    const data = await http.DELETE(`/api/bounties/${bountyId}`);

    return data;
  }

  async assignBounty (bountyId: string, assignee: string): Promise<BountyWithDetails> {

    const data = await http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, {
      assignee,
      status: 'assigned',
      updatedAt: new Date()
    });

    return data;
  }

  async updateBounty (bountyId: string, bounty: Partial<Bounty>): Promise<BountyWithDetails> {

    const data = await http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, bounty);

    return data;
  }

  async changeBountyStatus (bountyId: string, newStatus: BountyStatus): Promise<BountyWithDetails> {

    const data = await http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, {
      status: newStatus
    });

    return data;
  }

  async updateApplication (application: Application): Promise<Application> {

    const data = await http.PUT<Application>(`/api/applications/${application.id}`, application);

    return data;
  }

  async createApplication (application: Application): Promise<Application> {

    const data = await http.POST<Application>('/api/applications', application);

    return data;
  }

  async listApplications (bountyId: string): Promise<Application []> {

    const data = await http.GET<Application []>('/api/applications', { bountyId });

    return data;
  }

  recordTransaction (details: Pick<Transaction, 'bountyId' | 'transactionId' | 'chainId'>) {
    return http.POST('/api/transactions', details);
  }

  async getPricing (base: string, quote: FiatCurrency): Promise<IPairQuote> {

    const data = await http.GET<IPairQuote>('/api/crypto-price', { base, quote });

    return data;
  }

  // AWS
  uploadToS3 (file: File): Promise<{ token: any, bucket: string, key: string, region: string }> {
    const extension = file.name.split('.').pop() || ''; // lowercase the extension to simplify possible values
    const filename = encodeURIComponent(file.name.replace(extension, extension.toLowerCase()));
    return http.GET('/api/aws/s3-upload', { filename });
  }

  deleteFromS3 (src: string) {
    return http.DELETE('/api/aws/s3-delete', { src });
  }

  // Token Gates
  getTokenGates (query: { spaceId: string }) {
    return http.GET<TokenGate[]>('/api/token-gates', query);
  }

  getTokenGatesForSpace (query: { spaceDomain: string }) {
    return http.GET<(TokenGate & { space: Space })[]>('/api/token-gates', query);
  }

  saveTokenGate (tokenGate: Partial<TokenGate>): Promise<TokenGate> {
    return http.POST<TokenGate>('/api/token-gates', tokenGate);
  }

  deleteTokenGate (id: string) {
    return http.DELETE<TokenGate>(`/api/token-gates/${id}`);
  }

  verifyTokenGate ({ id, jwt }: { id: string, jwt: string }): Promise<{ error?: string, success?: boolean }> {

    return http.POST(`/api/token-gates/${id}/verify`, { jwt });
  }

  unlockTokenGate ({ id, jwt }: { id: string, jwt: string }):
    Promise<{ error?: string, success?: boolean, space: Space }> {

    return http.POST(`/api/token-gates/${id}/verify`, { commit: true, jwt });
  }

  getTokenMetaData ({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
    return http.GET('/api/tokens/metadata', { chainId, contractAddress });
  }

  createPaymentMethod (paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return http.POST('/api/payment-methods', paymentMethod);
  }

  listPaymentMethods (spaceId: string): Promise<PaymentMethod []> {
    return http.GET('/api/payment-methods', { spaceId });
  }

  deletePaymentMethod (paymentMethodId: string): Promise<PaymentMethod[]> {
    return http.DELETE(`/api/payment-methods/${paymentMethodId}`);
  }

  createRole (role: Partial<Role>): Promise<Role> {
    return http.POST('/api/roles', role);
  }

  updateRole (role: Partial<Role>): Promise<Role> {
    return http.PUT(`/api/roles/${role.id}`, role);
  }

  deleteRole (roleToDelete: {roleId: string, spaceId: string}): Promise<Role> {
    return http.DELETE('/api/roles', roleToDelete);
  }

  listRoles (spaceId: string): Promise<ListSpaceRolesResponse[]> {
    return http.GET('/api/roles', { spaceId });
  }

  assignRole (data: {spaceId: string, roleId: string, userId: string}): Promise<Role []> {
    return http.POST('/api/roles/assignment', data);
  }

  unassignRole (data: {spaceId: string, roleId: string, userId: string}): Promise<Role []> {
    return http.DELETE('/api/roles/assignment', data);
  }

  /**
   * Get full set of permissions for a specific user on a certain page
   */
  computeUserPagePermissions (request: IPagePermissionUserRequest): Promise<IPagePermissionFlags> {
    return http.GET('/api/permissions/query', request);
  }

  listPagePermissions (pageId: string): Promise<IPagePermissionWithAssignee []> {
    return http.GET('/api/permissions', { pageId });
  }

  createPermission (permission: IPagePermissionToCreate): Promise<boolean> {
    return http.POST('/api/permissions', permission);
  }

  deletePermission (permissionId: string): Promise<boolean> {
    return http.DELETE('/api/permissions', { permissionId });
  }
}

const charmClient = new CharmClient();

export default charmClient;
