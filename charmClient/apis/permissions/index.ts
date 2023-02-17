import { ForumApi } from './forumApi';
import { ProposalPermissionsApi } from './proposalsApi';

export class PermissionsApi {
  forum = new ForumApi();

  proposals = new ProposalPermissionsApi();
}
