import type { CommentFragment } from '@lens-protocol/client';

const MAX_COMMENT_DEPTH = 5;

type CommentFragmentWithMeta = CommentFragment & { parentId: string; depth: number };

export async function fetchLensPageComments({
  depth = 1,
  parentId
}: {
  parentId: string;
  depth: number;
}): Promise<CommentFragmentWithMeta[]> {
  if (depth === MAX_COMMENT_DEPTH) {
    return [];
  }

  const { lensClient } = await import('./lensClient');

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
    const nestedComments = await fetchLensPageComments({
      depth: depth + 1,
      parentId: comment.id
    });
    return [comment, ...nestedComments];
  });

  const nestedComments = await Promise.all(nestedCommentsPromises);

  // Sort based on ascending order of depth
  return nestedComments.flat().sort((a, b) => a.depth - b.depth);
}
