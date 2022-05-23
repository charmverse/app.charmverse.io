import { Block, Page, PagePermission } from '@prisma/client';

export interface IPageWithPermissions extends Page {
  permissions: (PagePermission & {sourcePermission: PagePermission | null}) []
}

export interface PageWithChildren extends IPageWithPermissions {
  children: IPageWithPermissions []
}

export interface ModifyChildPagesResponse {
  pageIds: string[]
  rootBlock: Block | null
}

export interface PageLink {
  title: string;
  url: string
}

export interface PagesRequest {
  spaceId: string;
  userId?: string;
}
