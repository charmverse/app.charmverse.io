
import {
  Application, Block, Bounty, InviteLink, Page, PagePermissionLevel, PaymentMethod, Prisma,
  Role, Space, TelegramUser, TokenGate, TokenGateToRole, User, UserDetails, UserGnosisSafe, UserVote
} from '@prisma/client';
import * as http from 'adapters/http';
import { Block as FBBlock, BlockPatch } from 'components/common/BoardEditor/focalboard/src/blocks/block';
import { IWorkspace } from 'components/common/BoardEditor/focalboard/src/blocks/workspace';
import { OctoUtils } from 'components/common/BoardEditor/focalboard/src/octoUtils';
import { IUser, UserWorkspace } from 'components/common/BoardEditor/focalboard/src/user';
import { FiatCurrency, IPairQuote } from 'connectors';
import type { FailedImportsError } from 'lib/notion/types';
import { IPagePermissionFlags, IPagePermissionToCreate, IPagePermissionUserRequest, IPagePermissionWithAssignee, IPagePermissionWithSource, SpaceDefaultPublicPageToggle } from 'lib/permissions/pages/page-permission-interfaces';
import { GetPoapsResponse, UpdatePoapsRequest } from 'lib/poap';
import { ITokenMetadata, ITokenMetadataRequest } from 'lib/tokens/tokenData';
import { BountyWithDetails, Contributor, LoggedInUser, PageContent } from 'models';
import type { ServerBlockFields } from 'pages/api/blocks';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import type { Response as CheckDomainResponse } from 'pages/api/spaces/checkDomain';
// TODO: Maybe move these types to another place so that we dont import from backend
import { ReviewDecision, SubmissionContent, SubmissionCreationData } from 'lib/applications/interfaces';
import { CommentCreate, CommentWithUser } from 'lib/comments/interfaces';
import { IPageWithPermissions, ModifyChildPagesResponse, PageLink } from 'lib/pages';
import { ThreadCreate, ThreadWithCommentsAndAuthors } from 'lib/threads/interfaces';
import { ConnectDiscordPayload, ConnectDiscordResponse } from 'pages/api/discord/connect';
import { ImportDiscordRolesPayload, ImportRolesResponse } from 'pages/api/discord/importRoles';
import { ImportGuildRolesPayload } from 'pages/api/guild-xyz/importRoles';
import { ListSpaceRolesResponse } from 'pages/api/roles';
import { GetTasksResponse } from 'pages/api/tasks/list';
import { GetTasksStateResponse, UpdateTasksState } from 'pages/api/tasks/state';
import { TelegramAccount } from 'pages/api/telegram/connect';
import { UpdateThreadRequest } from 'pages/api/threads/[id]';
import { TokenGateWithRoles } from 'pages/api/token-gates';

import { ApplicationWithTransactions } from 'lib/applications/actions';
import { AssignedBountyPermissions, BountySubmitterPoolCalculation, BountySubmitterPoolSize, BountyUpdate, SuggestionAction } from 'lib/bounties/interfaces';
import { DeepDaoAggregateData } from 'lib/deepdao/interfaces';
import { PublicPageResponse } from 'lib/pages/interfaces';
import { PublicBountyToggle, PublicSpaceInfo } from 'lib/spaces/interfaces';
import type { MarkTask } from 'lib/tasks/markTasks';
import { TransactionCreationData } from 'lib/transactions/interface';
import { ExtendedVote, UserVoteExtendedDTO, VoteDTO } from 'lib/votes/interfaces';
import { PublicUser } from 'pages/api/public/profile/[userPath]';
import { AssignedPermissionsQuery, Resource } from './lib/permissions/interfaces';
import { SpacePermissionConfigurationUpdate } from './lib/permissions/meta/interfaces';
import { SpacePermissionFlags, SpacePermissionModification } from './lib/permissions/spaces';

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

  getUserByPath (path: string) {
    return http.GET<PublicUser>(`/api/public/profile/${path}`);
  }

  createUser ({ address }: { address: string }) {
    return http.POST<LoggedInUser>('/api/profile', {
      address
    });
  }

  updateUser (data: Partial<User>) {
    return http.PUT<LoggedInUser>('/api/profile', data);
  }

  checkNexusPath (path: string) {
    return http.GET<{ available: boolean }>('/api/profile/checkPathAvailability', { path });
  }

  getUserDetails () {
    return http.GET<UserDetails>('/api/profile/details');
  }

  getUserPoaps () {
    return http.GET<GetPoapsResponse>('/api/profile/poaps');
  }

  updateUserPoaps (data: UpdatePoapsRequest) {
    return http.PUT<GetPoapsResponse>('/api/profile/poaps', data);
  }

  updateUserDetails (data: Partial<UserDetails>) {
    return http.PUT<UserDetails>('/api/profile/details', data);
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

  leaveSpace (spaceId: string) {
    return http.POST(`/api/spaces/${spaceId}/leave`);
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

  updateContributor ({ spaceId, userId, isAdmin }: { spaceId: string, userId: string, isAdmin: boolean }) {
    return http.PUT<Contributor[]>(`/api/spaces/${spaceId}/contributors/${userId}`, { isAdmin });
  }

  removeContributor ({ spaceId, userId }: { spaceId: string, userId: string }) {
    return http.DELETE<Contributor[]>(`/api/spaces/${spaceId}/contributors/${userId}`);
  }

  getPublicPageByViewId (viewId: string) {
    return http.GET<Page>(`/api/public/view/${viewId}`);
  }

  duplicatePage (pageId: string, parentId: string) {
    return http.POST<IPageWithPermissions>(`/api/pages/${pageId}/duplicate`, { parentId });
  }

  getBlockViewsByPageId (pageId: string) {
    return http.GET<Block []>(`/api/blocks/views/${pageId}`);
  }

  getPages (spaceId: string) {
    return http.GET<IPageWithPermissions[]>(`/api/spaces/${spaceId}/pages`);
  }

  getArchivedPages (spaceId: string) {
    return http.GET<IPageWithPermissions[]>(`/api/spaces/${spaceId}/pages?archived=true`);
  }

  getPageLink (pageId: string) {
    return http.GET<PageLink>(`/api/pages/${pageId}/link`);
  }

  createPage (pageOpts: Partial<Page>) {
    return http.POST<IPageWithPermissions>('/api/pages', pageOpts);
  }

  getPage (pageId: string, spaceId?:string) {
    return http.GET<IPageWithPermissions>(`/api/pages/${pageId}?spaceId=${spaceId}`);
  }

  archivePage (pageId: string) {
    return http.PUT<ModifyChildPagesResponse>(`/api/pages/${pageId}/archive`, { archive: true });
  }

  restorePage (pageId: string) {
    return http.PUT<ModifyChildPagesResponse>(`/api/pages/${pageId}/archive`, { archive: false });
  }

  deletePage (pageId: string) {
    return http.DELETE<ModifyChildPagesResponse>(`/api/pages/${pageId}`);
  }

  updatePage (pageOpts: Partial<Page>) {
    return http.PUT<IPageWithPermissions>(`/api/pages/${pageOpts.id}`, pageOpts);
  }

  favoritePage (pageId: string) {
    return http.POST<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  unfavoritePage (pageId: string) {
    return http.DELETE<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  setMyGnosisSafes (wallets: Partial<UserGnosisSafe>[]): Promise<UserGnosisSafe[]> {
    return http.POST('/api/profile/gnosis-safes', wallets);
  }

  getMyGnosisSafes (): Promise<UserGnosisSafe[]> {
    return http.GET('/api/profile/gnosis-safes');
  }

  updateMyGnosisSafe (wallet: { id: string, name: string }): Promise<UserGnosisSafe[]> {
    return http.PUT(`/api/profile/gnosis-safes/${wallet.id}`, wallet);
  }

  deleteMyGnosisSafe (walletId: string) {
    return http.DELETE(`/api/profile/gnosis-safes/${walletId}`);
  }

  getPublicPage (pageIdOrPath: string) {
    return http.GET<PublicPageResponse>(`/api/public/pages/${pageIdOrPath}`);
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
    return http.POST<User>('/api/telegram/disconnect');
  }

  disconnectDiscord () {
    return http.POST<User>('/api/discord/disconnect');
  }

  connectDiscord (payload: ConnectDiscordPayload) {
    return http.POST<ConnectDiscordResponse>('/api/discord/connect', payload);
  }

  importRolesFromDiscordServer (payload: ImportDiscordRolesPayload) {
    return http.POST<ImportRolesResponse>('/api/discord/importRoles', payload);
  }

  importRolesFromGuild (payload: ImportGuildRolesPayload) {
    return http.POST<{importedRolesCount: number}>('/api/guild-xyz/importRoles', payload);
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

    return contributors.map((contributor: Contributor) => ({
      id: contributor.id,
      username: contributor.username,
      email: '',
      props: {},
      create_at: new Date(contributor.createdAt).getTime(),
      update_at: new Date(contributor.updatedAt).getTime(),
      is_bot: false
    }));
  }

  async getPublicSpaceInfo (spaceId: string): Promise<Space> {
    return http.GET<Space>(`/api/spaces/${spaceId}/public`);
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

  async insertBlock (block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock (blockId: string, updater: BlockUpdater): Promise<void> {
    const { rootBlock } = await http.DELETE<{deletedCount: number, rootBlock: Block}>(`/api/blocks/${blockId}`);
    const fbBlock = this.blockToFBBlock(rootBlock);
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

  listBounties (spaceId: string, publicOnly?: boolean): Promise<BountyWithDetails[]> {
    return http.GET('/api/bounties', { spaceId, publicOnly });
  }

  async createBounty (bounty: Partial<Bounty>): Promise<BountyWithDetails> {

    return http.POST<BountyWithDetails>('/api/bounties', bounty);
  }

  async getBountyApplicantPool ({ resourceId, permissions }: BountySubmitterPoolCalculation): Promise<BountySubmitterPoolSize> {
    return http.POST<BountySubmitterPoolSize>('/api/bounties/pool', { permissions, resourceId });
  }

  /**
   * Get full set of permissions for a specific user on a certain page
   */
  async computeBountyPermissions ({ resourceId }: Resource): Promise<AssignedBountyPermissions> {
    return http.GET(`/api/bounties/${resourceId}/permissions`);
  }

  async reviewBountySuggestion ({ bountyId, decision }: SuggestionAction): Promise<BountyWithDetails | {success: true}> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/review-suggestion`, { decision });
  }

  async getBounty (bountyId: string): Promise<BountyWithDetails> {

    const data = await http.GET<BountyWithDetails>(`/api/bounties/${bountyId}`);

    return data;
  }

  async deleteBounty (bountyId: string): Promise<any> {

    return http.DELETE(`/api/bounties/${bountyId}`);
  }

  async updateBounty ({ bountyId, updateContent }: BountyUpdate): Promise<BountyWithDetails> {

    return http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, updateContent);
  }

  async closeBountySubmissions (bountyId: string): Promise<BountyWithDetails> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/close-submissions`);
  }

  async closeBounty (bountyId: string): Promise<BountyWithDetails> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/close`);
  }

  async approveApplication (applicationId: string): Promise<Application> {
    return http.POST<Application>(`/api/applications/${applicationId}/approve`);
  }

  async updateApplication (applicationId: string, update: Partial<Application>): Promise<Application> {

    const data = await http.PUT<Application>(`/api/applications/${applicationId}`, update);

    return data;
  }

  async createApplication (application: Application): Promise<Application> {

    const data = await http.POST<Application>('/api/applications', application);

    return data;
  }

  listApplications (bountyId: string, submissionsOnly: boolean): Promise<ApplicationWithTransactions []> {
    return http.GET('/api/applications', { bountyId, submissionsOnly });
  }

  async createSubmission (content: Omit<SubmissionCreationData, 'userId'>): Promise<Application> {

    return http.POST<Application>('/api/submissions', content);
  }

  async updateSubmission ({ submissionId, content }: { submissionId: string, content: SubmissionContent }): Promise<Application> {

    return http.PUT<Application>(`/api/submissions/${submissionId}`, content);
  }

  async reviewSubmission (submissionId: string, decision: ReviewDecision): Promise<Application> {

    return http.POST<Application>(`/api/submissions/${submissionId}/review`, {
      decision
    });
  }

  async markSubmissionAsPaid (submissionId: string) {
    return http.POST<Application>(`/api/submissions/${submissionId}/mark-as-paid`);
  }

  recordTransaction (data: TransactionCreationData) {
    return http.POST('/api/transactions', data);
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
    return http.GET<TokenGateWithRoles[]>('/api/token-gates', query);
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

  updateTokenGateRoles (tokenGateId: string, spaceId: string, roleIds: string[]) {
    return http.POST<TokenGateToRole[]>(`/api/token-gates/${tokenGateId}/roles`, { spaceId, roleIds });
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

  deletePaymentMethod (paymentMethodId: string) {
    return http.DELETE(`/api/payment-methods/${paymentMethodId}`);
  }

  getTasksState (): Promise<GetTasksStateResponse> {
    return http.GET('/api/tasks/state');
  }

  updateTasksState (payload: UpdateTasksState) {
    return http.PUT('/api/tasks/state', payload);
  }

  getTasks (): Promise<GetTasksResponse> {
    return http.GET('/api/tasks/list');
  }

  createRole (role: Partial<Role>): Promise<Role> {
    return http.POST('/api/roles', role);
  }

  updateRole (role: Partial<Role>): Promise<Role> {
    return http.PUT(`/api/roles/${role.id}`, role);
  }

  deleteRole (roleId: string): Promise<Role> {
    return http.DELETE(`/api/roles/${roleId}`);
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

  listPagePermissions (pageId: string): Promise<IPagePermissionWithAssignee[]> {
    return http.GET('/api/permissions', { pageId });
  }

  createPermission (permission: IPagePermissionToCreate): Promise<IPagePermissionWithSource> {
    return http.POST('/api/permissions', permission);
  }

  deletePermission (permissionId: string): Promise<boolean> {
    return http.DELETE('/api/permissions', { permissionId });
  }

  addSpacePermissions ({ forSpaceId, operations, roleId, spaceId, userId }: SpacePermissionModification): Promise<SpacePermissionFlags> {
    return http.POST<SpacePermissionFlags>(`/api/permissions/space/${forSpaceId}/add`, {
      operations,
      roleId,
      spaceId,
      userId
    } as Omit<SpacePermissionModification, 'forSpaceId'>);
  }

  removeSpacePermissions ({ forSpaceId, operations, roleId, spaceId, userId }: SpacePermissionModification): Promise<SpacePermissionFlags> {
    return http.POST<SpacePermissionFlags>(`/api/permissions/space/${forSpaceId}/remove`, {
      operations,
      roleId,
      spaceId,
      userId
    } as Omit<SpacePermissionModification, 'forSpaceId'>);
  }

  queryGroupSpacePermissions ({ group, id, resourceId }: AssignedPermissionsQuery): Promise<SpacePermissionFlags> {
    return http.GET<SpacePermissionFlags>(`/api/permissions/space/${resourceId}/query`, {
      group,
      id
    });
  }

  computeUserSpacePermissions ({ spaceId }: {spaceId: string}): Promise<SpacePermissionFlags> {
    return http.GET<SpacePermissionFlags>(`/api/permissions/space/${spaceId}/compute`);
  }

  startThread (request: Omit<ThreadCreate, 'userId'>): Promise<ThreadWithCommentsAndAuthors> {
    return http.POST('/api/threads', request);
  }

  deleteThread (threadId: string) {
    return http.DELETE(`/api/threads/${threadId}`);
  }

  updateThread (threadId: string, request: UpdateThreadRequest) {
    return http.PUT(`/api/threads/${threadId}`, request);
  }

  addComment (request: Omit<CommentCreate, 'userId'>): Promise<CommentWithUser> {
    return http.POST('/api/comments', request);
  }

  editComment (commentId: string, content: PageContent): Promise<CommentWithUser> {
    return http.PUT(`/api/comments/${commentId}`, { content });
  }

  deleteComment (commentId: string) {
    return http.DELETE(`/api/comments/${commentId}`);
  }

  getPageThreads (pageId: string): Promise<ThreadWithCommentsAndAuthors[]> {
    return http.GET(`/api/pages/${pageId}/threads`);
  }

  updateSnapshotConnection (spaceId: string, data: Pick<Space, 'snapshotDomain' | 'defaultVotingDuration'>): Promise<Space> {
    return http.PUT(`/api/spaces/${spaceId}/snapshot`, data);
  }

  setDefaultPagePermission ({ spaceId, pagePermissionLevel }:{spaceId: string, pagePermissionLevel: PagePermissionLevel | null}) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-default-page-permissions`, {
      pagePermissionLevel
    });
  }

  setSpacePermissionMode ({ permissionConfigurationMode, spaceId }: SpacePermissionConfigurationUpdate) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-permissions-mode`, { permissionConfigurationMode });
  }

  setDefaultPublicPages ({ spaceId, defaultPublicPages }: SpaceDefaultPublicPageToggle) {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-default-public-pages`, {
      defaultPublicPages
    });
  }

  setPublicBountyBoard ({ publicBountyBoard, spaceId }: PublicBountyToggle): Promise<Space> {
    return http.POST<Space>(`/api/spaces/${spaceId}/set-public-bounty-board`, {
      publicBountyBoard
    });
  }

  updatePageSnapshotData (pageId: string, data: Pick<Page, 'snapshotProposalId'>): Promise<IPageWithPermissions> {
    return http.PUT(`/api/pages/${pageId}/snapshot`, data);
  }

  getBuildId () {
    return http.GET<{ buildId: string }>('/api/build-id');
  }

  markTasks (tasks: MarkTask[]) {
    return http.POST('/api/tasks/mark', tasks);
  }

  getAggregatedData (userPath: string) {
    return http.GET<DeepDaoAggregateData>(`/api/public/profile/${userPath}/aggregate`);
  }

  getVotesByPage (pageId: string) {
    return http.GET<ExtendedVote[]>(`/api/pages/${pageId}/votes`);
  }

  getVotesBySpace (spaceId: string) {
    return http.GET<ExtendedVote[]>(`/api/spaces/${spaceId}/votes`);
  }

  createVote (votePayload: VoteDTO) {
    return http.POST<ExtendedVote>('/api/votes', votePayload);
  }

  cancelVote (voteId: string) {
    return http.PUT(`/api/votes/${voteId}`, {
      status: 'Cancelled'
    });
  }

  deleteVote (voteId: string) {
    return http.DELETE(`/api/votes/${voteId}`);
  }

  castVote (voteId: string, choice: string) {
    return http.POST<UserVote>(`/api/votes/${voteId}/cast`, {
      choice
    });
  }

  getUserVotes (voteId: string) {
    return http.GET<UserVoteExtendedDTO[]>(`/api/votes/${voteId}/user-votes`);
  }
}

const charmClient = new CharmClient();

export default charmClient;
