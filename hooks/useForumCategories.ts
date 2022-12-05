import type { PostCategory } from '@prisma/client';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useForumFilters } from './useForumFilters';

export function useForumCategories() {
  const currentSpace = useCurrentSpace();
  const { refetchForumCategories } = useForumFilters();

  async function createForumCategory(categoryName: string) {
    if (currentSpace) {
      await charmClient.forum.createPostCategory(currentSpace.id, {
        name: categoryName,
        spaceId: currentSpace.id
      });
      refetchForumCategories();
    }
  }

  async function updateForumCategory(option: PostCategory) {
    if (currentSpace) {
      await charmClient.forum.updatePostCategory({
        spaceId: currentSpace.id,
        id: option.id,
        color: option.color,
        name: option.name
      });
      refetchForumCategories();
    }
  }

  async function deleteForumCategory(option: PostCategory) {
    if (currentSpace) {
      await charmClient.forum.deletePostCategory({ id: option.id, spaceId: currentSpace.id });
      refetchForumCategories();
    }
  }

  return {
    createForumCategory,
    deleteForumCategory,
    updateForumCategory
  };
}
