import type { PageNode } from '@charmverse/core/pages';
import type { Application, Page } from '@charmverse/core/prisma';
import { randomETHWalletAddress as _randomETHWalletAddress } from '@packages/utils/blockchain';
import { getPagePath } from '@root/lib/pages/utils';
import type { RequiredNotNull } from '@root/lib/utils/types';
import { v4 } from 'uuid';

export function generatePageToCreateStub({
  userId,
  spaceId,
  title,
  parentId,
  id = v4(),
  type
}: { userId: string } & Pick<Page, 'spaceId'> &
  Partial<Pick<Page, 'title' | 'parentId' | 'id' | 'type'>>): Partial<Page> {
  return {
    id,
    createdBy: userId,
    contentText: '',
    path: getPagePath(),
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
export function generatePageNode({
  // Default values for props reflects our app defaults
  id = v4(),
  parentId = null,
  type = 'page',
  index = -1,
  deletedAt = null,
  createdAt = new Date(),
  title = 'Untitled',
  spaceId = v4()
}: Partial<PageNode<Pick<Page, 'title'>>>): PageNode<Pick<Page, 'title'>> {
  return {
    id,
    type,
    parentId,
    index,
    createdAt,
    deletedAt,
    title,
    spaceId
  };
}

export function generateSubmissionContent(): RequiredNotNull<
  Pick<Application, 'submission' | 'submissionNodes' | 'walletAddress'>
> {
  return {
    submission: 'My submission and all of its content',
    submissionNodes:
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"My submission and all of its content"}]}]}',
    walletAddress: '0x123456789'
  };
}

/**
 * Generate a random lowercase wallet address
 */
export function randomETHWalletAddress() {
  return _randomETHWalletAddress().toLowerCase();
}
export function randomDomain() {
  return `test-${v4()}.nft`;
}
