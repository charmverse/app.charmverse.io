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

// These 2 types are used for reducing a list of pages to a tree
// Generic type A is optional, we can mount additional properties on basic node definitions

// eslint-disable-next-line @typescript-eslint/ban-types
export type PageNode<A = {}> = Pick<Page, 'id' | 'type' | 'parentId' | 'index' | 'createdAt' | 'deletedAt'> & A

// eslint-disable-next-line @typescript-eslint/ban-types
export type PageNodeWithChildren<A = {}> = PageNode<{children: PageNodeWithChildren<A>[]}> & A

export type PageNodeWithPermissions = PageNode<{permissions: (PagePermission & {sourcePermission: PagePermission | null})[]}>

/**
 * @rootPageIds The list of roots we want to track
 * @targetPageId Overrides root pageIds. Ensures only the root containing the target page ID will be returned
 */
export interface PageTreeMappingInput<T extends PageNode> {
  items: T[], rootPageIds?: string[],
  targetPageId?: string
}

export type TargetPageTree<R extends PageNodeWithChildren = PageNodeWithChildren> = {
  parents: R[],
  targetPage: R
}
