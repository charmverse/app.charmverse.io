import { Page } from '@prisma/client';
import { SubmissionContent } from 'lib/applications/interfaces';
import { PageNode } from 'lib/pages/interfaces';
import { v4 } from 'uuid';

export function generatePageToCreateStub ({
  userId,
  spaceId,
  title,
  parentId,
  id = v4(),
  type
}: {userId: string} & Pick<Page, 'spaceId'> & Partial<Pick<Page, 'title' | 'parentId' | 'id' | 'type'>>): Partial<Page> {
  return {
    id,
    createdBy: userId,
    contentText: '',
    path: `page-${id}`,
    title: title || 'Root',
    type: type ?? 'page',
    updatedBy: userId,
    spaceId,
    parentId
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
}: Partial<PageNode<Pick<Page, 'title' | 'type'>>>): PageNode<Pick<Page, 'title' | 'type'>> {
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
