import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  AssignedPagePermission,
  PagePermissionAssignment,
  PagePermissionWithSource
} from '@charmverse/core/permissions';
import type {
  ApiPageKey,
  Block,
  FavoritePage,
  InviteLink,
  Page,
  PaymentMethod,
  Space,
  TelegramUser,
  TokenGateToRole,
  User,
  UserDetails,
  UserWallet
} from '@charmverse/core/prisma';
import type { FiatCurrency, IPairQuote } from 'connectors';

import * as http from 'adapters/http';
import type { AuthSig, ExtendedPoap } from 'lib/blockchain/interfaces';
import type { BlockPatch, Block as FBBlock } from 'lib/focalboard/block';
import type { InviteLinkPopulated } from 'lib/invites/getInviteLink';
import type { PublicInviteLinkRequest } from 'lib/invites/getPublicInviteLink';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import type { Web3LoginRequest } from 'lib/middleware/requireWalletSignature';
import type { FailedImportsError } from 'lib/notion/types';
import type { ModifyChildPagesResponse, PageLink } from 'lib/pages';
import type { PublicPageResponse } from 'lib/pages/interfaces';
import type { PermissionResource } from 'lib/permissions/interfaces';
import type { AggregatedProfileData } from 'lib/profile';
import type { ITokenMetadata, ITokenMetadataRequest } from 'lib/tokens/tokenData';
import { encodeFilename } from 'lib/utilities/encodeFilename';
import type { SocketAuthResponse } from 'lib/websockets/interfaces';
import type { LoggedInUser } from 'models';
import type { ServerBlockFields } from 'pages/api/blocks';
import type { ImportGuildRolesPayload } from 'pages/api/guild-xyz/importRoles';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import { BlockchainApi } from './apis/blockchainApi';
import { BountiesApi } from './apis/bountiesApi';
import { CommentsApi } from './apis/commentsApi';
import { DiscordApi } from './apis/discordApi';
import { FileApi } from './apis/fileApi';
import { ForumApi } from './apis/forumApi';
import { GnosisSafeApi } from './apis/gnosisSafeApi';
import { GoogleApi } from './apis/googleApi';
import { IframelyApi } from './apis/iframelyApi';
import { MembersApi } from './apis/membersApi';
import { MuxApi } from './apis/muxApi';
import { PagesApi } from './apis/pagesApi';
import { PermissionsApi } from './apis/permissions';
import { ProfileApi } from './apis/profileApi';
import { ProposalsApi } from './apis/proposalsApi';
import { PublicProfileApi } from './apis/publicProfileApi';
import { RolesApi } from './apis/rolesApi';
import { SpacesApi } from './apis/spacesApi';
import { SubscriptionApi } from './apis/subscriptionApi';
import { SummonApi } from './apis/summonApi';
import { TasksApi } from './apis/tasksApi';
import { TokenGatesApi } from './apis/tokenGates';
import { TrackApi } from './apis/trackApi';
import { UnstoppableDomainsApi } from './apis/unstoppableApi';
import { VotesApi } from './apis/votesApi';

type BlockUpdater = (blocks: FBBlock[]) => void;

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {
  blockchain = new BlockchainApi();

  bounties = new BountiesApi();

  comments = new CommentsApi();

  discord = new DiscordApi();

  file = new FileApi();

  forum = new ForumApi();

  google = new GoogleApi();

  iframely = new IframelyApi();

  members = new MembersApi();

  mux = new MuxApi();

  pages = new PagesApi();

  profile = new ProfileApi();

  publicProfile = new PublicProfileApi();

  proposals = ProposalsApi;

  roles = new RolesApi();

  spaces = new SpacesApi();

  summon = new SummonApi();

  tasks = new TasksApi();

  track = new TrackApi();

  permissions = new PermissionsApi();

  unstoppableDomains = new UnstoppableDomainsApi();

  votes = new VotesApi();

  tokenGates = new TokenGatesApi();

  subscription = new SubscriptionApi();

  gnosisSafe = new GnosisSafeApi();

  async socket() {
    return http.GET<SocketAuthResponse>('/api/socket');
  }

  async login({ address, walletSignature }: Web3LoginRequest) {
    const user = await http.POST<LoggedInUser>('/api/session/login', {
      address,
      walletSignature
    });
    return user;
  }

  async logout() {
    await http.POST('/api/session/logout');
  }

  getUser() {
    return http.GET<LoggedInUser>('/api/profile');
  }

  createUser({ address, walletSignature }: Web3LoginRequest) {
    return http.POST<LoggedInUser>('/api/profile', {
      address,
      walletSignature
    });
  }

  updateUser(data: Partial<User> & { addressesToAdd?: AuthSig[] }) {
    return http.PUT<LoggedInUser>('/api/profile', data);
  }

  getUserDetails() {
    return http.GET<UserDetails>('/api/profile/details');
  }

  getUserPoaps(userId: string) {
    return http.GET<ExtendedPoap[]>(`/api/profile/poaps/${userId}`);
  }

  updateUserDetails(data: Partial<UserDetails>) {
    return http.PUT<UserDetails>('/api/profile/details', data);
  }

  addUserWallets(data: AuthSig[]) {
    return http.POST<User>('/api/profile/add-wallets', { addressesToAdd: data });
  }

  removeUserWallet(address: Pick<UserWallet, 'address'>) {
    return http.POST<LoggedInUser>('/api/profile/remove-wallet', address);
  }

  getPublicPageByViewId(viewId: string) {
    return http.GET<Page>(`/api/public/view/${viewId}`);
  }

  getBlockViewsByPageId(pageId: string) {
    return http.GET<Block[]>(`/api/blocks/views/${pageId}`);
  }

  getPageLink(pageId: string) {
    return http.GET<PageLink>(`/api/pages/${pageId}/link`);
  }

  createPage(pageOpts: Partial<Page>) {
    return http.POST<PageWithPermissions>('/api/pages', pageOpts);
  }

  archivePage(pageId: string) {
    return http.PUT<ModifyChildPagesResponse>(`/api/pages/${pageId}/archive`, { archive: true });
  }

  restorePage(pageId: string) {
    return http.PUT<ModifyChildPagesResponse>(`/api/pages/${pageId}/archive`, { archive: false });
  }

  deletePage(pageId: string) {
    return http.DELETE<ModifyChildPagesResponse>(`/api/pages/${pageId}`);
  }

  deletePages(pageIds: string[]) {
    return http.DELETE<undefined>(`/api/pages`, { pageIds });
  }

  favoritePage(pageId: string) {
    return http.POST<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  unfavoritePage(pageId: string) {
    return http.DELETE<Partial<LoggedInUser>>('/api/profile/favorites', { pageId });
  }

  updateFavoritePages(favorites: Omit<FavoritePage, 'userId'>[]) {
    return http.PUT<FavoritePage[]>('/api/profile/favorites', favorites);
  }

  getPublicPage(pageIdOrPath: string) {
    return http.GET<PublicPageResponse>(`/api/public/pages/${pageIdOrPath}`);
  }

  updateInviteLinkRoles(inviteLinkId: string, spaceId: string, roleIds: string[]) {
    return http.PUT<InviteLinkWithRoles[]>(`/api/invites/${inviteLinkId}/roles`, { spaceId, roleIds });
  }

  createInviteLink(link: Partial<InviteLink>) {
    return http.POST<InviteLink>('/api/invites', link);
  }

  deleteInviteLink(linkId: string) {
    return http.DELETE<InviteLinkWithRoles[]>(`/api/invites/${linkId}`);
  }

  getInviteLinks(spaceId: string) {
    return http.GET<InviteLinkWithRoles[]>('/api/invites', { spaceId });
  }

  getPublicInviteLink({ visibleOn, spaceId }: PublicInviteLinkRequest) {
    return http.GET<InviteLinkPopulated>('/api/invites/public', { spaceId, visibleOn });
  }

  acceptInvite({ id }: { id: string }) {
    return http.POST<InviteLinkWithRoles[]>(`/api/invites/${id}/accept`);
  }

  importFromNotion(payload: { code: string; spaceId: string }) {
    return http.POST<{ failedImports: FailedImportsError[] }>('/api/notion/import', payload);
  }

  connectTelegram(telegramAccount: TelegramAccount) {
    return http.POST<TelegramUser>('/api/telegram/connect', telegramAccount);
  }

  disconnectTelegram() {
    return http.POST<User>('/api/telegram/disconnect');
  }

  importRolesFromGuild(payload: ImportGuildRolesPayload) {
    return http.POST<{ importedRolesCount: number }>('/api/guild-xyz/importRoles', payload);
  }

  async getAllBlocks(spaceId: string): Promise<FBBlock[]> {
    return http
      .GET<Block[]>('/api/blocks', { spaceId })
      .then((blocks) => blocks.map(this.blockToFBBlock))
      .then((blocks) => this.fixBlocks(blocks));
  }

  getSubtree(rootId?: string, levels = 2): Promise<FBBlock[]> {
    return http
      .GET<Block[]>(`/api/blocks/${rootId}/subtree`, { levels })
      .then((blocks) => blocks.map(this.blockToFBBlock))
      .then((blocks) => this.fixBlocks(blocks));
  }

  async fixBlocks(blocks: FBBlock[]): Promise<FBBlock[]> {
    const OctoUtils = (await import('components/common/BoardEditor/focalboard/src/octoUtils')).OctoUtils;
    // Hydrate is important, as it ensures that each block is complete to the current model
    const fixedBlocks = OctoUtils.hydrateBlocks(blocks);
    return fixedBlocks;
  }

  private blockToFBBlock(block: Block): FBBlock {
    return {
      ...block,
      deletedAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
      createdAt: new Date(block.createdAt).getTime(),
      updatedAt: new Date(block.updatedAt).getTime(),
      type: block.type as FBBlock['type'],
      fields: block.fields as FBBlock['fields']
    };
  }

  private fbBlockToBlock(fbBlock: FBBlock): Omit<Block, ServerBlockFields> {
    return {
      id: fbBlock.id,
      parentId: fbBlock.parentId,
      rootId: fbBlock.rootId,
      schema: fbBlock.schema,
      type: fbBlock.type,
      title: fbBlock.title,
      fields: fbBlock.fields,
      deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
      createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
      updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
    };
  }

  async insertBlock(block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock(blockId: string, updater: BlockUpdater): Promise<void> {
    const { rootBlock } = await http.DELETE<{ deletedCount: number; rootBlock: Block }>(`/api/blocks/${blockId}`);
    const fbBlock = this.blockToFBBlock(rootBlock);
    fbBlock.deletedAt = new Date().getTime();
    updater([fbBlock]);
  }

  async deleteBlocks(blockIds: string[], updater: BlockUpdater): Promise<void> {
    const rootBlocks = await http.DELETE<Block[]>(`/api/blocks`, blockIds);
    const fbBlocks = rootBlocks.map((rootBlock) => ({
      ...this.blockToFBBlock(rootBlock),
      deletedAt: new Date().getTime()
    }));
    updater(fbBlocks);
  }

  async insertBlocks(fbBlocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> {
    const blocksInput = fbBlocks.map(this.fbBlockToBlock);
    const newBlocks = await http.POST<Block[]>('/api/blocks', blocksInput);
    const newFBBlocks = newBlocks.map(this.blockToFBBlock);
    updater(newFBBlocks);
    return newFBBlocks;
  }

  async patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> {
    const currentBlocks = await http.GET<Block[]>('/api/blocks', { id: blockId });
    const currentFBBlock = this.blockToFBBlock(currentBlocks[0]);
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const blockInput = this.fbBlockToBlock(fbBlockInput);
    const updatedBlocks = await http.PUT<Block[]>('/api/blocks', [blockInput]);
    const fbBlock = this.blockToFBBlock(updatedBlocks[0]);
    updater([fbBlock]);
  }

  async updateBlock(blockInput: FBBlock) {
    const newBlock = this.fbBlockToBlock(blockInput);
    return http.PUT<Block[]>('/api/blocks', [newBlock]);
  }

  async patchBlocks(_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> {
    const updatedBlockInput = _blocks.map((currentFBBlock, i) => {
      const { deletedFields = [], updatedFields = {}, ...updates } = blockPatches[i];
      const fbBlockInput = Object.assign(currentFBBlock, updates, {
        fields: { ...(currentFBBlock.fields as object), ...updatedFields }
      });
      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return this.fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await http.PUT<Block[]>('/api/blocks', updatedBlockInput);
    const fbBlocks = updatedBlocks.map(this.blockToFBBlock);
    updater(fbBlocks);
  }

  async getPricing(base: string, quote: FiatCurrency): Promise<IPairQuote> {
    const data = await http.GET<IPairQuote>('/api/crypto-price', { base, quote });

    return data;
  }

  // AWS
  uploadToS3(file: File): Promise<{ token: any; bucket: string; key: string; region: string }> {
    return http.GET('/api/aws/s3-upload', { filename: encodeFilename(file.name) });
  }

  deleteFromS3(src: string) {
    return http.DELETE('/api/aws/s3-delete', { src });
  }

  // evaluate ({ , jwt }: { id: string, jwt: string }): Promise<{ error?: string, success?: boolean }> {

  //   return http.POST(`/api/token-gates/${id}/verify`, { jwt });
  // }

  unlockTokenGate({
    id,
    jwt
  }: {
    id: string;
    jwt: string;
  }): Promise<{ error?: string; success?: boolean; space: Space }> {
    return http.POST(`/api/token-gates/${id}/verify`, { commit: true, jwt });
  }

  updateTokenGateRoles(tokenGateId: string, spaceId: string, roleIds: string[]) {
    return http.PUT<TokenGateToRole[]>(`/api/token-gates/${tokenGateId}/roles`, { spaceId, roleIds });
  }

  getTokenMetaData({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
    return http.GET('/api/tokens/metadata', { chainId, contractAddress });
  }

  createPaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return http.POST('/api/payment-methods', paymentMethod);
  }

  listPaymentMethods(spaceId: string): Promise<PaymentMethod[]> {
    return http.GET('/api/payment-methods', { spaceId });
  }

  deletePaymentMethod(paymentMethodId: string) {
    return http.DELETE(`/api/payment-methods/${paymentMethodId}`);
  }

  listPagePermissions(pageId: string): Promise<AssignedPagePermission[]> {
    return http.GET('/api/permissions', { pageId });
  }

  createPermission(permission: PagePermissionAssignment): Promise<PagePermissionWithSource> {
    return http.POST('/api/permissions', permission);
  }

  deletePermission(query: PermissionResource): Promise<boolean> {
    return http.DELETE('/api/permissions', query);
  }

  restrictPagePermissions({ pageId }: { pageId: string }): Promise<PageWithPermissions> {
    return http.POST(`/api/pages/${pageId}/restrict-permissions`, {});
  }

  updatePageSnapshotData(pageId: string, data: Pick<Page, 'snapshotProposalId'>): Promise<PageWithPermissions> {
    return http.PUT(`/api/pages/${pageId}/snapshot`, data);
  }

  createProposalSource({ pageId }: { pageId: string }) {
    return http.POST<void>(`/api/pages/${pageId}/proposal-source`);
  }

  updateProposalSource({ pageId }: { pageId: string }) {
    return http.PUT<void>(`/api/pages/${pageId}/proposal-source`);
  }

  getBuildId() {
    return http.GET<{ buildId: string }>('/api/build-id');
  }

  getAggregatedData(userId: string) {
    return http.GET<AggregatedProfileData>(`/api/public/profile/${userId}/aggregate`);
  }

  getApiPageKeys({ pageId }: { pageId: string }) {
    return http.GET<ApiPageKey[]>(`/api/api-page-key?pageId=${pageId}`);
  }

  createApiPageKey({ pageId, type }: { pageId: string; type: ApiPageKey['type'] }) {
    return http.POST<ApiPageKey>(`/api/api-page-key`, { type, pageId });
  }

  testSpaceWebhook({ spaceId, webhookUrl }: { spaceId: string; webhookUrl: string }) {
    return http.POST<{ status: number }>(`/api/spaces/${spaceId}/test-webhook`, { webhookUrl });
  }

  resizeImage(formData: FormData) {
    return http.POST<{ url: string }>('/api/image/resize', formData, {
      noHeaders: true,
      skipStringifying: true
    });
  }
}

const charmClient = new CharmClient();

export default charmClient;
