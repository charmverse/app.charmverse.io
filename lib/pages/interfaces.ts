import type { Page, PagePermission, Space } from '@charmverse/core/prisma';

import type { BountyWithDetails } from 'lib/bounties';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import type { PagePermissionMeta } from 'lib/permissions/interfaces';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';

export type PageWithPermissionsMeta = Page & {
  permissions: PagePermissionMeta[];
};

export interface PageWithChildren extends IPageWithPermissions {
  children: PageWithChildren[];
}

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
    | 'snapshotProposalId'
    | 'spaceId'
    | 'title'
    | 'type'
    | 'updatedAt'
    | 'updatedBy'
  > & { permissionFlags: IPagePermissionFlags };

export type PageDetails = {
  id: string;
  content: string | number | boolean | Record<string, any> | any[] | null;
  contentText: string;
  spaceId: string;
};

export type PageWithProposal = Page & { proposal: ProposalWithUsers | null };

export type PagesMap<P extends PageMeta | PageNode = PageMeta> = Record<string, P | undefined>;

export type PageUpdates = Partial<Page> & { id: string };
export type PageDetailsUpdates = Partial<PageDetails> & { id: string };

export interface IPageMetaWithPermissions extends PageMeta {
  permissions: (PagePermission & { sourcePermission: PagePermission | null })[];
}

export interface PublicPageResponse {
  page: PageWithContent;
  boardPages: Page[];
  space: Space;
  cards: Card[];
  boards: Board[];
  views: BoardView[];
  bounty: BountyWithDetails | null;
}
