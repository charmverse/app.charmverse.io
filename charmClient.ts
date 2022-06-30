
import {
  Application, Block, Bounty, InviteLink, Page, PagePermissionLevel, PaymentMethod, Prisma,
  Role, Space, TelegramUser, TokenGate, TokenGateToRole, User, UserDetails, UserGnosisSafe, UserVote, Vote, VoteStatus
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
import { SuggestionAction } from 'lib/bounties';
import { PublicPageResponse } from 'lib/pages/interfaces';
import { PublicSpaceInfo } from 'lib/spaces/interfaces';
import type { MarkTask } from 'lib/tasks/markTasks';
import { TransactionCreationData } from 'lib/transactions/interface';
import { PublicUser } from 'pages/api/public/profile/[userPath]';
import { DeepDaoAggregateData } from 'lib/deepdao/interfaces';
import { v4 } from 'uuid';
import { ExtendedVote, VoteDTO } from 'lib/votes/interfaces';
import { deleteVote } from 'lib/votes';
import { AssignedPermissionsQuery } from './lib/permissions/interfaces';
import { SpacePermissionFlags, SpacePermissionModification } from './lib/permissions/spaces';
import { SpacePermissionConfigurationUpdate } from './lib/permissions/meta/interfaces';

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

  createPage (pageOpts: Prisma.PageCreateInput) {
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

  updatePage (pageOpts: Prisma.PageUpdateInput) {
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

  async getPublicSpaceInfo (spaceId: string): Promise<PublicSpaceInfo> {
    return http.GET<PublicSpaceInfo>(`/api/spaces/${spaceId}/public`);
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

  listBounties (spaceId: string): Promise<BountyWithDetails[]> {
    return http.GET('/api/bounties', { spaceId });
  }

  async createBounty (bounty: Partial<Bounty>): Promise<Bounty> {

    const data = await http.POST<Bounty>('/api/bounties', bounty);

    return data;
  }

  async reviewBountySuggestion ({ bountyId, decision }: SuggestionAction): Promise<BountyWithDetails | {success: true}> {
    return http.POST<BountyWithDetails>(`/api/bounties/${bountyId}/review-suggestion`, { decision });
  }

  async getBounty (bountyId: string): Promise<BountyWithDetails> {

    const data = await http.GET<BountyWithDetails>(`/api/bounties/${bountyId}`);

    return data;
  }

  async deleteBounty (bountyId: string): Promise<any> {

    const data = await http.DELETE(`/api/bounties/${bountyId}`);

    return data;
  }

  async updateBounty (bountyId: string, bounty: Partial<Bounty>): Promise<BountyWithDetails> {

    const data = await http.PUT<BountyWithDetails>(`/api/bounties/${bountyId}`, bounty);

    return data;
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

  async paySubmission (submissionId: string) {
    return http.POST<Application>(`/api/submissions/${submissionId}/pay`);
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

  async getPageVotes (pageId: string): Promise<ExtendedVote[]> {
    // function randomIntFromInterval (min: number, max: number) { // min and max included
    //   return Math.floor(Math.random() * (max - min + 1) + min);
    // }

    // function createUserVote (choice: string, voteId: string, userId?: string) {
    //   userId = userId ?? v4();
    //   return {
    //     choice,
    //     userId,
    //     createdAt: new Date(),
    //     updatedAt: new Date((new Date().getTime() - randomIntFromInterval(1, 24) * 60 * 60 * 1000)),
    //     voteId,
    //     user: {
    //       id: userId,
    //       avatar: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50',
    //       username: v4().split('-')[0]
    //     }
    //   } as ExtendedVote['userVotes'][0];
    // }

    // function createUserVotes (count: number, choice: string, voteId: string) {
    //   return new Array(count).fill(null).map(() => createUserVote(choice, voteId));
    // }

    // const vote1Id = v4();
    // const vote2Id = 'c11f0309-63b1-460a-b4a1-2e086fb9cc0a';
    // const vote3Id = v4();
    // return [{
    //   deadline: new Date(new Date().getTime() - (12 * 60 * 60 * 1000)), // 12 hrs ago
    //   description: 'My first vote',
    //   id: vote3Id,
    //   title: 'Passed vote',
    //   threshold: 50,
    //   voteOptions: [{
    //     name: 'Yes',
    //     voteId: vote3Id
    //   }, {
    //     name: 'No',
    //     voteId: vote3Id
    //   }, {
    //     name: 'Abstain',
    //     voteId: vote3Id
    //   }],
    //   createdAt: new Date(),
    //   pageId: v4(),
    //   createdBy: 'b1c1735e-da3c-4856-bd7c-fa9b13978e2',
    //   spaceId: '',
    //   status: 'Passed',
    //   userVotes: [
    //     ...createUserVotes(10, 'Yes', vote3Id),
    //     ...createUserVotes(2, 'No', vote3Id),
    //     ...createUserVotes(7, 'Abstain', vote3Id)
    //   ]
    // }, {
    //   deadline: new Date(new Date().getTime() + (12 * 60 * 60 * 1000)), // 12 hrs
    //   description: 'My first vote',
    //   threshold: 50,
    //   id: vote1Id,
    //   title: 'Vote 1',
    //   options: [{
    //     name: 'Yes',
    //     voteId: vote1Id
    //   }, {
    //     name: 'No',
    //     voteId: vote1Id
    //   }, {
    //     name: 'Abstain',
    //     voteId: vote1Id
    //   }],
    //   createdAt: new Date(),
    //   pageId: v4(),
    //   initiatorId: 'b1c1735e-da3c-4856-bd7c-fa9b13978e29',
    //   status: 'Cancelled',
    //   userVotes: [
    //     ...createUserVotes(5, 'Yes', vote1Id),
    //     ...createUserVotes(8, 'No', vote1Id),
    //     ...createUserVotes(9, 'Abstain', vote1Id)
    //   ]
    // }, {
    //   deadline: new Date(new Date().getTime() + (48 * 60 * 60 * 1000)), // 48 hrs
    //   description: 'My Second Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam pulvinar, dolor in molestie sagittis, orci eros lacinia eros, vel hendrerit dolor mi vitae quam. Proin convallis tincidunt congue. Suspendisse lorem dui, faucibus suscipit lectus nec, porta placerat nisi. Aenean a orci eu nisi euismod ornare. Suspendisse feugiat nibh mi, ut varius purus dignissim nec. Praesent vitae sapien sapien. Curabitur a tempus orci. Vestibulum at rutrum neque. Mauris sit amet lacus volutpat augue mattis tempor quis vel ante. Quisque sodales eu enim at lobortis. Donec fringilla feugiat faucibus. Nunc vitae massa et est aliquet lobortis. Ut sit amet risus non risus dapibus hendrerit. Etiam tincidunt convallis sagittis. \n Aenean non aliquet turpis. Maecenas eget nibh non lectus bibendum pellentesque. Suspendisse vulputate magna at libero aliquam, vitae consectetur sem maximus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam ornare mollis lacus at suscipit. In scelerisque semper dolor nec aliquam. Nullam nec lorem in sem aliquet dapibus in at ex. Nunc mattis ante et mi porttitor, a pretium sapien laoreet. Maecenas blandit condimentum lorem in sollicitudin. Cras non convallis purus, ultrices elementum dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque eleifend nec dui vitae semper. Nulla gravida mauris non tristique venenatis. Aliquam a nisi cursus, vulputate erat vitae, dignissim mi. Nullam mi tortor, euismod accumsan semper eget, tincidunt volutpat diam.\nIn ut nulla metus. Sed vestibulum tortor vel justo bibendum suscipit. Integer sodales elit dui, et tempus tellus volutpat sed. Nullam tincidunt metus elementum dui iaculis aliquet. Pellentesque hendrerit laoreet posuere. In eleifend leo vel vestibulum bibendum. Curabitur nec sapien vitae erat pellentesque maximus eget et turpis. Quisque eu fringilla sem, dignissim congue augue. Morbi id nisl vel felis vulputate mattis. Ut pellentesque ex id eros rutrum, sollicitudin maximus tortor convallis. Sed fermentum augue nec sem imperdiet ultricies. Suspendisse ac dignissim purus. Nunc facilisis vulputate dolor. Maecenas in volutpat ligula. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
    //   id: vote2Id,
    //   threshold: 50,
    //   title: 'Vote 2',
    //   options: [{
    //     name: 'Option 1'
    //   }, {
    //     name: 'Option 2'
    //   }, {
    //     name: 'Option 3'
    //   }, {
    //     name: 'No Change'
    //   }],
    //   createdAt: new Date(),
    //   pageId: v4(),
    //   initiatorId: 'b1c1735e-da3c-4856-bd7c-fa9b13978e29',
    //   status: 'InProgress',
    //   userVotes: [
    //     createUserVote('Option 1', vote2Id, 'b1c1735e-da3c-4856-bd7c-fa9b13978e29'),
    //     ...createUserVotes(2, 'Option 1', vote2Id),
    //     ...createUserVotes(7, 'Option 2', vote2Id),
    //     ...createUserVotes(4, 'Option 3', vote2Id),
    //     ...createUserVotes(3, 'No Change', vote2Id)
    //   ]
    // }];

    return http.GET(`/api/pages/${pageId}/votes`);
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
}

const charmClient = new CharmClient();

export default charmClient;
