import { ForumPermissionsApi } from './forumApi';
import { PagePermissionsApi } from './pagesApi';
import { ProposalPermissionsApi } from './proposalsApi';
import { SpacePermissionsApi } from './spacePermissionsApi';

export class PermissionsApi {
  forum = new ForumPermissionsApi();

  proposals = new ProposalPermissionsApi();

  pages = new PagePermissionsApi();

  spaces = new SpacePermissionsApi();
}
