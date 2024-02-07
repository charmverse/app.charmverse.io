import type { PageMeta, PageNode, PageNodeWithChildren, PageWithPermissions } from '@charmverse/core/pages';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { Page, Space } from '@charmverse/core/prisma';

import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';
import type { RewardWithUsersAndPageMeta } from 'lib/rewards/interfaces';

export type PageWithPermissionsMeta = Page & {
  permissions: PagePermissionMeta[];
};

export type PageWithChildren = PageNodeWithChildren<PageWithPermissions>;

export interface ModifyChildPagesResponse {
  pageIds: string[];
}

export interface PageLink {
  title: string;
  url: string;
}

// extend PageMeta so that we can populate usePages hook while /pages is loading
export type PageWithContent = PageMeta &
  Pick<
    Page,
    | 'id'
    | 'bountyId'
    | 'cardId'
    | 'content'
    | 'contentText'
    | 'convertedProposalId'
    | 'createdAt'
    | 'createdBy'
    | 'deletedAt'
    | 'fontFamily'
    | 'fontSizeSmall'
    | 'fullWidth'
    | 'headerImage'
    | 'icon'
    | 'parentId'
    | 'proposalId'
    | 'spaceId'
    | 'title'
    | 'type'
    | 'updatedAt'
    | 'updatedBy'
    | 'syncWithPageId'
    | 'sourceTemplateId'
  > & { permissionFlags: PagePermissionFlags };

export type PageDetails = {
  id: string;
  content: string | number | boolean | Record<string, any> | any[] | null;
  contentText: string;
  spaceId: string;
};

export type PagesMap<P extends PageMeta | PageNode = PageMeta> = Record<string, P | undefined>;

export type PageUpdates = Partial<Page> & { id: string };
export type PageDetailsUpdates = Partial<PageDetails> & { id: string };
export interface PublicPageResponse {
  page: PageWithContent;
  boardPages: Page[];
  space: Space;
  cards: Card[];
  boards: Board[];
  views: BoardView[];
  bounty: RewardWithUsersAndPageMeta | null;
}
