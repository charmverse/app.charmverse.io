import { Page, PagePermission } from '@prisma/client';

export interface IPageWithPermissions extends Page {
  permissions: (PagePermission & {sourcePermission: PagePermission | null}) []
}
