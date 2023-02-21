import type { Post, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { extractMentions } from 'lib/prosemirror/extractMentions';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { ForumTask, ForumTasksGroup } from '../comments/interface';

type SpaceRecord = Record<string, Pick<Space, 'name' | 'domain' | 'id'>>;
export function getPropertiesFromPost(post: Pick<Post, 'spaceId' | 'title' | 'id' | 'path'>, spaceRecord: SpaceRecord) {
  return {
    postId: post.id,
    spaceId: post.spaceId,
    spaceDomain: spaceRecord[post.spaceId].domain,
    postPath: post.path,
    spaceName: spaceRecord[post.spaceId].name,
    postTitle: post.title || 'Untitled'
  } as const;
}
