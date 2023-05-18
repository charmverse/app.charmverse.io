import { prisma } from '@charmverse/core/prisma-client';

export function updateFavoritePages({
  favoritePages,
  userId
}: {
  favoritePages: { pageId: string; index: number }[];
  userId: string;
}) {
  return prisma.$transaction(
    favoritePages.map((favorite) =>
      prisma.favoritePage.update({
        where: {
          pageId_userId: {
            userId,
            pageId: favorite.pageId
          }
        },
        data: {
          ...favorite
        }
      })
    )
  );
}
