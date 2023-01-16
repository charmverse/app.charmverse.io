import type { User } from '@prisma/client';

export interface DiscussionTask {
  spaceId: string;
  spaceDomain: string;
  spaceName: string;
  pageId: string;
  pagePath: string;
  pageTitle: string;
  bountyId: string | null;
  bountyTitle: string | null; // TODO: remove this in a separate PR once all clients have been updated to not read it
  commentId: string | null;
  mentionId: string | null;
  createdAt: string;
  createdBy: User | null;
  text: string;
  type: 'bounty' | 'page';
}
