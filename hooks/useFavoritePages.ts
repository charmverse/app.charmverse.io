import { useMemo } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export type FavoritePage = {
  pageId: string;
  index?: number;
};

export function useFavoritePages() {
  const { user, updateUser } = useUser();

  const favorites: FavoritePage[] = useMemo(() => {
    const items = user?.favorites || [];
    items.sort((a, b) => (a.index || 0) - (b.index || 0));

    return items;
  }, [user?.favorites]);
  const favoritePageIds = useMemo(() => favorites.map((f) => f.pageId), [favorites]);

  const reorderFavorites = async ({ reorderId, nextSiblingId }: { reorderId: string; nextSiblingId: string }) => {
    const siblings = favorites.filter(({ pageId }) => pageId !== reorderId) ?? [];
    const originIndex: number = siblings.findIndex(({ pageId }) => pageId === nextSiblingId);
    const reorderedFavorites = [
      ...siblings.slice(0, originIndex),
      { pageId: reorderId, index: originIndex },
      ...siblings.slice(originIndex)
    ].map((f, index) => ({ ...f, index }));

    // TODO - save favorites with indexes in db
    await charmClient.updateFavoritePages(reorderedFavorites);
    updateUser({ favorites: reorderedFavorites });
  };

  return { favorites, reorderFavorites, favoritePageIds };
}
