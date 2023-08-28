import type { User } from '@charmverse/core/prisma-client';
import { Prisma, prisma } from '@charmverse/core/prisma-client';
import type { CommentFragment, ProfileFragment } from '@lens-protocol/client';
import { PublicationTypes } from '@lens-protocol/client';

import { lensClient } from 'lib/lens/lensClient';
import { parseMarkdown } from 'lib/prosemirror/plugins/markdown/parseMarkdown';

import { listPageComments } from './listPageComments';

const usernameSuffix = 'lens-imported';
const pathSuffix = '-lens-bot';

export async function syncPageComments({
  userId,
  pageId,
  lensPostLink
}: {
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

  let allLensComments: CommentFragment[] = [];

  const lensComments = await lensClient.publication.fetchAll({
    publicationTypes: [PublicationTypes.Comment],
    publicationIds: [lensPostLink]
  });

  allLensComments.push(...(lensComments.items as CommentFragment[]));

  while (lensComments.pageInfo.next) {
    const nextComments = await lensClient.publication.fetchAll({
      publicationTypes: [PublicationTypes.Comment],
      publicationIds: [lensPostLink],
      cursor: lensComments.pageInfo.next
    });
    allLensComments.push(...(nextComments.items as CommentFragment[]));
  }

  // Filter out the lens comments which have been already publish from charmVerse
  allLensComments = allLensComments.filter((lensComment) => !commentIdsPublishedToLens.has(lensComment.id));

  // Keep track of the lens comment id and the lens user handle
  const lensCommentIdUserHandleRecord: Record<string, string> = {};

  // Keep track of the lens user handle and their charmverse user id
  const lensUserHandleUserIdRecord: Record<string, string> = {};

  // keep track of lens user handle and their lens profile
  const lensUserHandleProfileRecord: Record<string, ProfileFragment> = {};

  // Keep track of all the lens users who have commented on the proposal
  const lensUserProfiles: ProfileFragment[] = [];
  const lensUserHandles = new Set<string>();

  // lens user handles
  allLensComments.forEach((lensComment) => {
    if (!lensUserHandles.has(lensComment.profile.handle)) {
      lensUserHandles.add(lensComment.profile.handle);
      lensUserHandleProfileRecord[lensComment.profile.handle] = lensComment.profile;
      lensUserProfiles.push(lensComment.profile);
    }
  });

  // Check for their corresponding charmVerse users
  const existingLensUsersInCharmVerse = await prisma.user.findMany({
    where: {
      username: {
        in: [...lensUserHandles].map((lensUserHandle) => `${lensUserHandle}-${usernameSuffix}`)
      }
    }
  });

  existingLensUsersInCharmVerse.forEach((existingLensUser) => {
    const lensHandle = existingLensUser.username.replace(`-${usernameSuffix}`, '');
    lensUserHandleUserIdRecord[lensHandle] = existingLensUser.id;
  });

  // Create the users who don't exist in charmVerse

  for (const lensComment of allLensComments) {
    lensCommentIdUserHandleRecord[lensComment.id] = lensComment.profile.handle;
  }

  const commentCreateInputs: Prisma.PageCommentCreateManyInput[] = [];

  for (const lensComment of allLensComments) {
    const lensUserHandle = lensCommentIdUserHandleRecord[lensComment.id];
    const charmVerseUserId = lensUserHandleUserIdRecord[lensUserHandle];
    commentCreateInputs.push({
      pageId,
      createdBy: charmVerseUserId,
      contentText: lensComment.metadata.content ? lensComment.metadata.content : '',
      content: lensComment.metadata.content ? parseMarkdown(lensComment.metadata.content) : Prisma.JsonNull
    });
  }

  if (commentCreateInputs.length) {
    await prisma.pageComment.createMany({
      data: commentCreateInputs
    });
  }

  return listPageComments({
    pageId,
    userId
  });
}
