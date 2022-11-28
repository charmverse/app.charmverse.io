import charmClient from 'charmClient';

import { useUser } from './useUser';

export function useToggleFavorite({ pageId }: { pageId?: string }) {
  const { user, setUser } = useUser();
  const isFavorite = pageId && user?.favorites.some(({ pageId: _pageId }) => pageId === _pageId);

  async function toggleFavorite() {
    if (pageId) {
      const updatedFields = isFavorite
        ? await charmClient.unfavoritePage(pageId)
        : await charmClient.favoritePage(pageId);
      setUser({ ...user, ...updatedFields });
    }
  }

  return {
    isFavorite,
    toggleFavorite
  };
}
