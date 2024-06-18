import type { PageType } from '@charmverse/core/prisma';

import type { BaseEvent } from './BaseEvent';

export type PageEvent = BaseEvent & {
  pageId?: string;
};

export type StaticPageType =
  | 'proposals_list'
  | 'bounties_list'
  | 'forum_posts_list'
  | 'members_list'
  | 'settings/my-account'
  | 'settings/my-profile'
  | 'settings/my-projects'
  | 'settings/my-charms'
  | 'settings/api'
  | 'settings/space'
  | 'settings/roles-and-permissions'
  | 'settings/import'
  | 'settings/invites'
  | 'settings/credentials'
  | 'settings/proposals'
  | 'settings/integrations'
  | 'settings/notifications'
  | 'billing/marketing'
  | 'billing/checkout'
  | 'billing/settings';

type ViewPageEvent = PageEvent & {
  postId?: string;
  meta?: { pathname: string };
  type: PageType | 'post' | StaticPageType;
  // include these to remove from URL
  spaceDomain?: string;
  spaceCustomDomain?: string | null;
};

export interface PageEventMap {
  page_view: ViewPageEvent;
  archive_page: PageEvent;
  duplicate_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  edit_page: PageEvent;
  create_page: PageEvent;
  page_comment_created: PageEvent;
  page_comment_resolved: PageEvent;
  poll_created: PageEvent;
  page_suggestion_created: PageEvent;
  page_suggestion_accepted: PageEvent;
  export_page_markdown: PageEvent;
  export_page_csv: PageEvent;
  import_page_csv: PageEvent;
}

export type PageEventName = keyof PageEventMap;
