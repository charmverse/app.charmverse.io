import { User } from '@prisma/client';

export interface PageMentionedTask {
  spaceId: string
  spaceDomain: string
  spaceName: string
  pageId: string
  pagePath: string
  pageTitle: string
  bountyId: string | null
  bountyTitle: string | null
  commentId: string | null
  mentionId: string
  createdAt: string
  createdBy: User | null
  text: string
  type: 'page'
}

export interface BountyMentionedTask {
  spaceId: string
  spaceDomain: string
  spaceName: string
  pageId: string | null
  pagePath: string | null
  pageTitle: string | null
  bountyId: string
  bountyTitle: string
  commentId: string | null
  mentionId: string
  createdAt: string
  createdBy: User | null
  text: string
  type: 'bounty'
}

export interface CommentMentionedTask {
  spaceId: string
  spaceDomain: string
  spaceName: string
  pageId: string
  pagePath: string
  pageTitle: string
  bountyId: string | null
  bountyTitle: string | null
  commentId: string
  mentionId: string
  createdAt: string
  createdBy: User | null
  text: string
  type: 'comment'
}

export type MentionedTask = PageMentionedTask | BountyMentionedTask | CommentMentionedTask
