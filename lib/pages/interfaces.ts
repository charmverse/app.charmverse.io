import { Block, Page, PagePermission, Space } from '@prisma/client';

export interface IPageWithPermissions extends Page {
  permissions: (PagePermission & {sourcePermission: PagePermission | null}) []
}

export interface PageWithChildren extends IPageWithPermissions {
  children: PageWithChildren []
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
  archived?: boolean
  pageIds?: string[]
}

export interface PublicPageResponse {
  page: Page;
  boardPage: Page | null;
  pageBlock: Block | null;
  boardBlock: Block | null;
  space: Space;
}
