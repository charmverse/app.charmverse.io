import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  ApiPageKey,
  FavoritePage,
  InviteLink,
  Page,
  PaymentMethod,
  TelegramUser,
  User,
  UserDetails
} from '@charmverse/core/prisma';
import * as http from '@packages/adapters/http';
import type { FiatCurrency, IPairQuote } from '@packages/blockchain/connectors/chains';
import type { BlockWithDetails, BlockPatch, UIBlockWithDetails as FBBlock } from '@packages/databases/block';
import type { ExtendedPoap } from '@packages/lib/blockchain/interfaces';
import type { FarcasterUser } from '@packages/lib/farcaster/getFarcasterUsers';
import type { InviteLinkPopulated } from '@packages/lib/invites/getInviteLink';
import type { PublicInviteLinkRequest } from '@packages/lib/invites/getPublicInviteLink';
import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';
import type { CreateEventPayload } from '@packages/lib/notifications/interfaces';
import type { TelegramAccount } from '@packages/lib/telegram/interfaces';
import type { ITokenMetadata, ITokenMetadataRequest } from '@packages/lib/tokens/tokenData';
import type { AggregatedProfileData } from '@packages/profile/getAggregatedData';
import type { LoggedInUser } from '@packages/profile/getUser';
import { encodeFilename } from '@packages/utils/encodeFilename';

import type { SelectedProposalProperties } from 'components/common/DatabaseEditor/components/viewSidebar/viewSourceOptions/components/ProposalSourceProperties/interfaces';
import { blockToFBBlock, fbBlockToBlock, fixBlocks } from 'components/common/DatabaseEditor/utils/blockUtils';
import type { FailedImportsError } from 'lib/notion/interfaces';
import type { TrashOrDeletePageResponse, PageLink } from 'lib/pages';
import type { PublicPageResponse } from 'lib/pages/interfaces';
import type { SocketAuthResponse } from 'lib/websockets/interfaces';
import type { ImportGuildRolesPayload } from 'pages/api/guild-xyz/importRoles';

import { BlockchainApi } from './apis/blockchainApi';
import { CommentsApi } from './apis/commentsApi';
import { CredentialsApi } from './apis/credentialsApi';
import { DiscordApi } from './apis/discordApi';
import { FileApi } from './apis/fileApi';
import { ForumApi } from './apis/forumApi';
import { GnosisSafeApi } from './apis/gnosisSafeApi';
import { GoogleApi } from './apis/googleApi';
import { IframelyApi } from './apis/iframelyApi';
import { MembersApi } from './apis/membersApi';
import { MuxApi } from './apis/muxApi';
import { NotificationsApi } from './apis/notificationsApi';
import { PagesApi } from './apis/pagesApi';
import { PermissionsApi } from './apis/permissions';
import { ProfileApi } from './apis/profileApi';
import { ProjectsApi } from './apis/projectsApi';
import { ProposalsApi } from './apis/proposalsApi';
import { PublicProfileApi } from './apis/publicProfileApi';
import { RewardsApi } from './apis/rewardsApi';
import { RolesApi } from './apis/rolesApi';
import { SpacesApi } from './apis/spacesApi';
import { SubscriptionApi } from './apis/subscriptionApi';
import { SummonApi } from './apis/summonApi';
import { TrackApi } from './apis/trackApi';
import { VotesApi } from './apis/votesApi';

type BlockUpdater = (blocks: FBBlock[]) => void;

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {
  blockchain = new BlockchainApi();

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

  proposals = new ProposalsApi();

  roles = new RolesApi();

  spaces = new SpacesApi();

  summon = new SummonApi();

  notifications = new NotificationsApi();

  track = new TrackApi();

  permissions = new PermissionsApi();

  votes = new VotesApi();

  subscription = new SubscriptionApi();

  gnosisSafe = new GnosisSafeApi();

  rewards = new RewardsApi();

  credentials = new CredentialsApi();

  projects = new ProjectsApi();

  async socket() {
    return http.GET<SocketAuthResponse>('/api/socket');
  }

  updateUser(data: Partial<User>) {
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

  getPublicPageByViewId(viewId: string) {
    return http.GET<Page>(`/api/public/view/${viewId}`);
  }

  getPageLink(pageId: string) {
    return http.GET<PageLink>(`/api/pages/${pageId}/link`);
  }

  createPage(pageOpts: Partial<Page>) {
    return http.POST<PageWithPermissions>('/api/pages', pageOpts);
  }

  deletePageForever(pageId: string) {
    return http.DELETE<TrashOrDeletePageResponse>(`/api/pages/${pageId}`);
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

  getBlock({ blockId }: { blockId: string }) {
    return http.GET<BlockWithDetails>(`/api/blocks/${blockId}`).then(blockToFBBlock);
  }

  getSubtree({ pageId }: { pageId: string }) {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/subtree`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  getViews({ pageId }: { pageId: string }): Promise<FBBlock[]> {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/views`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  getComments({ pageId }: { pageId: string }): Promise<FBBlock[]> {
    return http
      .GET<BlockWithDetails[]>(`/api/blocks/${pageId}/comments`)
      .then((blocks) => blocks.map(blockToFBBlock))
      .then((blocks) => fixBlocks(blocks));
  }

  async insertBlock(block: FBBlock, updater: BlockUpdater): Promise<FBBlock[]> {
    return this.insertBlocks([block], updater);
  }

  async deleteBlock(blockId: string, updater: BlockUpdater): Promise<void> {
    const { rootBlock } = await http.DELETE<{ deletedCount: number; rootBlock: BlockWithDetails }>(
      `/api/blocks/${blockId}`
    );
    const fbBlock = blockToFBBlock(rootBlock);
    fbBlock.deletedAt = new Date().getTime();
    updater([fbBlock]);
  }

  async deleteBlocks(blockIds: string[], updater: BlockUpdater): Promise<void> {
    const rootBlocks = await http.DELETE<BlockWithDetails[]>(`/api/blocks`, { blockIds });
    const fbBlocks = rootBlocks.map((rootBlock) => ({
      ...blockToFBBlock(rootBlock),
      deletedAt: new Date().getTime()
    }));
    updater(fbBlocks);
  }

  async insertBlocks(fbBlocks: FBBlock[], updater: BlockUpdater): Promise<FBBlock[]> {
    const blocksInput = fbBlocks.map(fbBlockToBlock);
    const newBlocks = await http.POST<BlockWithDetails[]>('/api/blocks', blocksInput);
    const newFBBlocks = newBlocks.map(blockToFBBlock);
    updater(newFBBlocks);
    return newFBBlocks;
  }

  async patchBlock(blockId: string, blockPatch: BlockPatch, updater: BlockUpdater): Promise<void> {
    const currentFBBlock: FBBlock = blockToFBBlock(await http.GET<BlockWithDetails>(`/api/blocks/${blockId}`));
    const { deletedFields = [], updatedFields = {}, ...updates } = blockPatch;
    const fbBlockInput = Object.assign(currentFBBlock, updates, {
      fields: { ...(currentFBBlock.fields as object), ...updatedFields }
    });
    deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
    const { isLocked, ...blockInput } = fbBlockToBlock(fbBlockInput);
    const updatedBlocks = await http.PUT<BlockWithDetails[]>('/api/blocks', [blockInput]);
    const fbBlock = blockToFBBlock(updatedBlocks[0]);
    updater([fbBlock]);
  }

  async updateBlock(blockInput: FBBlock) {
    const newBlock = fbBlockToBlock(blockInput);
    return http.PUT<BlockWithDetails[]>('/api/blocks', [newBlock]);
  }

  async patchBlocks(_blocks: FBBlock[], blockPatches: BlockPatch[], updater: BlockUpdater): Promise<void> {
    const updatedBlockInput = _blocks.map((currentFBBlock, i) => {
      const { deletedFields = [], updatedFields = {}, ...updates } = blockPatches[i];
      const fbBlockInput = Object.assign(currentFBBlock, updates, {
        fields: { ...(currentFBBlock.fields as object), ...updatedFields }
      });

      deletedFields.forEach((field) => delete fbBlockInput.fields[field]);
      return fbBlockToBlock(fbBlockInput);
    });
    const updatedBlocks = await http.PUT<BlockWithDetails[]>('/api/blocks', updatedBlockInput);
    const fbBlocks = updatedBlocks.map(blockToFBBlock);
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

  getTokenMetaData({ chainId, contractAddress }: ITokenMetadataRequest): Promise<ITokenMetadata> {
    return http.GET('/api/tokens/metadata', { chainId, contractAddress });
  }

  createPaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return http.POST('/api/payment-methods', paymentMethod);
  }

  deletePaymentMethod(paymentMethodId: string) {
    return http.DELETE(`/api/payment-methods/${paymentMethodId}`);
  }

  restrictPagePermissions({ pageId }: { pageId: string }): Promise<PageWithPermissions> {
    return http.POST(`/api/pages/${pageId}/restrict-permissions`, {});
  }

  createProposalSource({
    selectedProperties,
    pageId
  }: {
    selectedProperties: SelectedProposalProperties;
    pageId: string;
  }) {
    return http.POST<void>(`/api/pages/${pageId}/proposal-source`, { selectedProperties });
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

  createEvents({ payload, spaceId }: { spaceId: string; payload: CreateEventPayload[] }) {
    return http.POST<void>(`/api/spaces/${spaceId}/event`, payload);
  }

  resolveEnsName(ens: string) {
    return http.GET<string | null>('/api/resolve-ens', { ens });
  }

  searchFarcasterUser({ username }: { username: string }) {
    return http.GET<FarcasterUser[]>(`/api/farcaster/search-by-username`, { username });
  }
}

const charmClient = new CharmClient();

export default charmClient;
