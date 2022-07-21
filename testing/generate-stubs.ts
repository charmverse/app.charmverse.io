import { Page, PageType } from '@prisma/client';
import { SubmissionContent } from 'lib/applications/interfaces';
import { v4 } from 'uuid';
import { PageNode } from 'lib/pages/interfaces';

export function generatePageToCreateStub (options: {
  userId:string,
  spaceId: string,
  title?: string,
  parentId?: string | null
  id?: string,
  type?: PageType,
}): Partial<Page> {
  return {
    id: options.id,
    createdBy: options.userId,
    contentText: '',
    path: `page-${options.id}`,
    title: options.title || 'Root',
    type: options.type ?? 'page',
    updatedBy: options.userId,
    spaceId: options.spaceId,
    parentId: options.parentId
  };
}

/**
 * This function provides a subset of Pages, which is enough to create simulated trees and assess tree resolution behaviour
 */
export function generatePageNode ({
  // Default values for props reflects our app defaults
  id = v4(),
  parentId = null,
  type = 'page',
  index = -1,
  deletedAt = null,
  createdAt = new Date(),
  title = 'Untitled'
}: Partial<PageNode<Pick<Page, 'title'>>>): PageNode<Pick<Page, 'title'>> {
  return {
    id,
    type,
    parentId,
    index,
    createdAt,
    deletedAt,
    title
  };
}

export function generateSubmissionContent (): SubmissionContent {
  return {
    submission: 'My submission and all of its content',
    submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission and all of its content"}]}]}',
    walletAddress: '0x123456789'
  };
}
