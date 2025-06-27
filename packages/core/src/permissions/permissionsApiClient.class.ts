import { ForumPermissionsHttpClient } from './forums/client/forumPermissionsHttpClient';
import type { BaseForumPermissionsClient, PremiumForumPermissionsClient } from './forums/client/interfaces';
import type { PagePermissionsClient } from './pages/client/interfaces';
import { PagePermissionsHttpClient } from './pages/client/pagePermissionsHttpClient';
import type { BaseProposalPermissionsClient, PremiumProposalPermissionsClient } from './proposals/client/interfaces';
import { ProposalPermissionsHttpClient } from './proposals/client/proposalPermissionsHttpClient';
import type { SpacePermissionsClient } from './spaces/client/interfaces';
import { SpacePermissionsHttpClient } from './spaces/client/spacePermissionsHttpClient';

export type PermissionsClient = {
  forum: BaseForumPermissionsClient;
  proposals: BaseProposalPermissionsClient;
};

export type PremiumPermissionsClient = {
  forum: PremiumForumPermissionsClient;
  proposals: PremiumProposalPermissionsClient;
  pages: PagePermissionsClient;
  spaces: SpacePermissionsClient;
};

export class PermissionsApiClient implements PremiumPermissionsClient {
  forum: PremiumForumPermissionsClient;

  proposals: PremiumProposalPermissionsClient;

  pages: PagePermissionsClient;

  spaces: SpacePermissionsClient;

  constructor() {
    this.forum = new ForumPermissionsHttpClient();
    this.proposals = new ProposalPermissionsHttpClient();
    this.pages = new PagePermissionsHttpClient();
    this.spaces = new SpacePermissionsHttpClient();
  }
}
