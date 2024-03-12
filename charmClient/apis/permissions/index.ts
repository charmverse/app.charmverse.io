import { ForumPermissionsApi } from './forumApi';
import { PagePermissionsApi } from './pagesApi';
import { SpacePermissionsApi } from './spacePermissionsApi';

export class PermissionsApi {
  forum = new ForumPermissionsApi();

  pages = new PagePermissionsApi();

  spaces = new SpacePermissionsApi();
}
