import { Prisma, prisma } from '@charmverse/core/prisma-client';
import { fetchLensPageComments } from '@packages/lib/lens/fetchLensPostComments';

import { parseMarkdown } from 'lib/prosemirror/markdown/parseMarkdown';

import { listPageComments } from './listPageComments';

const usernameSuffix = 'lens-imported';
const pathSuffix = 'lens-bot';

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

  const lensComments = await fetchLensPageComments({
    depth: 1,
    parentId: lensPostLink
  });

  const lensCommentIdCharmverseCommentIdRecord: Record<string, string> = {};

  for (const lensComment of lensComments) {
    const lensProfile = lensComment.by;

    if (!commentIdsPublishedToLens.has(lensComment.id)) {
      const lensUserHandle = lensProfile.handle?.fullHandle.toLowerCase();
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
            avatar:
              (lensProfile.metadata?.picture?.__typename === 'ImageSet'
                ? lensProfile.metadata?.picture?.optimized?.uri || lensProfile.metadata?.picture?.raw.uri
                : lensProfile.metadata?.picture?.image?.optimized?.uri ||
                  lensProfile.metadata?.picture?.image?.raw?.uri) || 'https://www.lensfrens.xyz/assets/defaultPfp.png',
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
