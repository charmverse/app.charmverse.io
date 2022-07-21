import { Page, PageType } from '@prisma/client';
import { SubmissionContent } from 'lib/applications/interfaces';
import { v4 } from 'uuid';

export function generatePageToCreateStub (options: {
  userId:string,
  spaceId: string,
  title?: string,
  parentId?: string | null
  type?: PageType,
}): Partial<Page> {
  return {
    createdBy: options.userId,
    contentText: '',
    path: v4(),
    title: options.title || 'Root',
    type: options.type ?? 'page',
    updatedBy: options.userId,
    spaceId: options.spaceId,
    parentId: options.parentId
  };
}

export function generateSubmissionContent (): SubmissionContent {
  return {
    submission: 'My submission and all of its content',
    submissionNodes: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission and all of its content"}]}]}',
    walletAddress: '0x123456789'
  };
}
