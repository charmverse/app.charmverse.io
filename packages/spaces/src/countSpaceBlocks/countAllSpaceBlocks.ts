import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import type { BlockCountInfo } from '../getSpaceBlockCount';

import type { CommentBlocksCount } from './countCommentBlocks';
import { countCommentBlocks } from './countCommentBlocks';
import type { DatabaseBlocksCount } from './countDatabaseBlockContentAndProps';
import { countDatabaseBlockContentAndProps } from './countDatabaseBlockContentAndProps';
import type { ForumBlocksCount } from './countForumBlocks';
import { countForumBlocks } from './countForumBlocks';
import { countMemberProperties, type MemberPropertyCounts } from './countMemberProperties';
import { countPageEditorContentBlocks } from './countPageEditorContentBlocks';
import { countProposalBlocks, type ProposalBlocksCount } from './countProposalBlocks';
import type { PageCounts } from './countSpacePages';
import { countSpacePages } from './countSpacePages';
import type { BlocksCountQuery, GenericBlocksCount } from './interfaces';

const defaultBatchSize = 500;

type SpaceBlockDetails = {
  comments: CommentBlocksCount;
  forum: ForumBlocksCount;
  editorContent: number;
  pages: PageCounts;
  databaseProperties: DatabaseBlocksCount;
  memberProperties: MemberPropertyCounts;
  proposals: ProposalBlocksCount;
};

export type OverallBlocksCount = GenericBlocksCount<SpaceBlockDetails>;

// a function that queries the database for the number of blocks, proposals, pages, and rewards in a space
export async function countSpaceBlocks({
  spaceId,
  batchSize = defaultBatchSize
}: BlocksCountQuery): Promise<OverallBlocksCount> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const [
    commentsCount,
    forumCount,
    pageEditorContentCount,
    databaseBlockPropsCount,
    pagesCount,
    memberPropertiesCount,
    proposalBlocksCount
  ] = await Promise.all([
    countCommentBlocks({ spaceId, batchSize }),
    countForumBlocks({ spaceId, batchSize }),
    countPageEditorContentBlocks({ spaceId, batchSize }),
    countDatabaseBlockContentAndProps({ spaceId, batchSize }),
    countSpacePages({ spaceId, batchSize }),
    countMemberProperties({ spaceId, batchSize }),
    countProposalBlocks({ spaceId, batchSize })
  ]);

  const total =
    commentsCount.total +
    forumCount.total +
    pageEditorContentCount +
    databaseBlockPropsCount.total +
    pagesCount.total +
    memberPropertiesCount.total +
    proposalBlocksCount.total;

  return {
    total,
    details: {
      comments: commentsCount,
      forum: forumCount,
      editorContent: pageEditorContentCount,
      pages: pagesCount,
      databaseProperties: databaseBlockPropsCount,
      memberProperties: memberPropertiesCount,
      proposals: proposalBlocksCount
    }
  };
}

export async function countSpaceBlocksAndSave({ spaceId }: { spaceId: string }): Promise<BlockCountInfo> {
  const countResult = await countSpaceBlocks({ spaceId });

  const blockCount = await prisma.blockCount.create({
    data: {
      count: countResult.total,
      space: { connect: { id: spaceId } },
      details: countResult.details
    }
  });

  return {
    count: blockCount.count,
    createdAt: blockCount.createdAt,
    details: blockCount.details
  };
}
