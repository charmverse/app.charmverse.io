import charmClient from 'charmClient';

import { useUser } from './useUser';

export function useToggleFavorite({ pageId }: { pageId?: string }) {
  const { user, updateUser } = useUser();
  const isFavorite = pageId && user?.favorites.some(({ pageId: _pageId }) => pageId === _pageId);

  async function toggleFavorite() {
    if (pageId) {
      const updatedFields = isFavorite
        ? await charmClient.unfavoritePage(pageId)
        : await charmClient.favoritePage(pageId);
      updateUser({ favorites: updatedFields.favorites });
    }
  }

  return {
    isFavorite,
    toggleFavorite
  };
}
