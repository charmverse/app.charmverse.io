import { ForumPermissionsApi } from './forumApi';
import { PagePermissionsApi } from './pagesApi';
import { ProposalPermissionsApi } from './proposalsApi';

export class PermissionsApi {
  forum = new ForumPermissionsApi();

  proposals = new ProposalPermissionsApi();

  pages = new PagePermissionsApi();
}
