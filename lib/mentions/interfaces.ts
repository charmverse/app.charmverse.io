import { User } from '@prisma/client';

export interface MentionedTask {
  pageId: string
  mentionId: string
  createdAt: string
  spaceId: string
  spaceDomain: string
  pagePath: string
  spaceName: string
  createdBy: User | null
  pageTitle: string
  text: string
}
