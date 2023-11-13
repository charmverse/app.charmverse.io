import { Prisma, prisma } from '@charmverse/core/prisma-client';
import type { CommentFragment } from '@lens-protocol/client';

import { lensClient } from 'lib/lens/lensClient';
import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown';

import { listPageComments } from './listPageComments';

const usernameSuffix = 'lens-imported';
const pathSuffix = 'lens-bot';

const MAX_COMMENT_DEPTH = 5;

type CommentFragmentWithMeta = CommentFragment & { parentId: string; depth: number };

async function fetchLensComments({
  depth = 1,
  parentId
}: {
  parentId: string;
  depth: number;
}): Promise<CommentFragmentWithMeta[]> {
  if (depth === MAX_COMMENT_DEPTH) {
    return [];
  }

  const comments: CommentFragmentWithMeta[] = [];
  let publicationFetchAllResponse = await lensClient.publication.fetchAll({
    where: {
      commentOn: {
        id: parentId
      }
    }
  });

  if (publicationFetchAllResponse.items.length === 0) {
    return [];
  }

  comments.push(
    ...(publicationFetchAllResponse.items.map((comment) => ({
      ...comment,
      depth,
      parentId
    })) as CommentFragmentWithMeta[])
  );

  while (publicationFetchAllResponse.pageInfo.next) {
    publicationFetchAllResponse = await lensClient.publication.fetchAll({
      cursor: publicationFetchAllResponse.pageInfo.next,
      where: {
        commentOn: {
          id: parentId
        }
      }
    });

    comments.push(
      ...(publicationFetchAllResponse.items.map((comment) => ({
        ...comment,
        depth,
        parentId
      })) as CommentFragmentWithMeta[])
    );
  }

  const nestedCommentsPromises = comments.map(async (comment) => {
    const nestedComments = await fetchLensComments({
      depth: depth + 1,
      parentId: comment.id
    });
    return [comment, ...nestedComments];
  });

  const nestedComments = await Promise.all(nestedCommentsPromises);

  // Sort based on ascending order of depth
  return nestedComments.flat().sort((a, b) => a.depth - b.depth);
}

export async function syncPageCommentsWithLensPost({
  userId,
  pageId,
  lensPostLink,
  spaceId
}: {
  spaceId: string;
  pageId: string;
  userId: string;
  lensPostLink: string;
}) {
  const currentCharmVerseComments = await listPageComments({
    pageId,
    userId
  });

  const commentIdsPublishedToLens = new Set(
    currentCharmVerseComments.filter((comment) => comment.lensCommentLink).map((comment) => comment.lensCommentLink)
  );

  const lensComments = await fetchLensComments({
    depth: 1,
    parentId: lensPostLink
  });

  const lensCommentIdCharmverseCommentIdRecord: Record<string, string> = {};

  for (const lensComment of lensComments) {
    if (!commentIdsPublishedToLens.has(lensComment.id)) {
      const lensUserHandle = lensComment.by.handle?.fullHandle.toLowerCase();
      let charmverseUserId: null | string = null;
      const charmVerseUser = await prisma.user.findFirst({
        where: {
          username: `${lensUserHandle}-${usernameSuffix}`
        },
        select: {
          id: true,
          spaceRoles: {
            where: {
              spaceId
            }
          }
        }
      });

      charmverseUserId = charmVerseUser?.id ?? null;

      if (!charmVerseUser) {
        const createdCharmVerseUser = await prisma.user.create({
          data: {
            username: `${lensUserHandle}-${usernameSuffix}`,
            path: `${lensUserHandle}-${pathSuffix}`,
            isBot: true,
            // TODO: Uncomment when we have cover pictures
            avatar: /* lensComment.by?..coverPicture?.__typename === 'MediaSet'
                ? lensComment.profile.coverPicture.original.url
                : lensComment.profile.coverPicture?.__typename === 'NftImage'
                ? lensComment.profile.coverPicture.uri
                :  */ null,
            spaceRoles: {
              create: {
                spaceId
              }
            }
          },
          select: {
            id: true
          }
        });

        charmverseUserId = createdCharmVerseUser.id;
      } else {
        const hasSpaceRole = charmVerseUser.spaceRoles.length === 0;
        if (hasSpaceRole) {
          await prisma.spaceRole.create({
            data: {
              spaceId,
              userId: charmVerseUser.id
            }
          });
        }
      }

      const contentText = lensComment.metadata?.__typename === 'TextOnlyMetadataV3' ? lensComment.metadata.content : '';
      const charmverseComment = await prisma.pageComment.create({
        data: {
          pageId,
          createdBy: charmverseUserId!,
          contentText,
          content: contentText ? parseMarkdown(contentText) : Prisma.JsonNull,
          lensCommentLink: lensComment.id,
          // Since we are sorting by depth, parent will always be created before child and thus will be in the record
          parentId:
            lensPostLink === lensComment.parentId ? null : lensCommentIdCharmverseCommentIdRecord[lensComment.parentId]
        }
      });

      lensCommentIdCharmverseCommentIdRecord[lensComment.id] = charmverseComment.id;
    }
  }

  return listPageComments({
    pageId,
    userId
  });
}
