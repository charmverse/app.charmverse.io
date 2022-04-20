import { IPageWithPermissions } from '../../../pages';
import { breakInheritance } from '../refresh-page-permission-tree';

export async function setupPermissionsAfterPageBecameRoot (pageId: string): Promise<IPageWithPermissions> {
  return breakInheritance(pageId);
}
