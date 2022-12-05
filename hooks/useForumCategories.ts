import type { PostCategory } from '@prisma/client';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useForumFilters } from './useForumFilters';

export function useForumCategories() {
  const currentSpace = useCurrentSpace();
  const { mutateForumCategories } = useForumFilters();

  async function createForumCategory(categoryName: string) {
    if (currentSpace) {
      const createdCategory = await charmClient.forum.createPostCategory(currentSpace.id, {
        name: categoryName,
        spaceId: currentSpace.id
      });
      mutateForumCategories(
        (forumCategories) => {
          return forumCategories ? [...forumCategories, createdCategory] : [];
        },
        { revalidate: false }
      );
    }
  }

  async function updateForumCategory(option: PostCategory) {
    if (currentSpace) {
      const updatedCategory = await charmClient.forum.updatePostCategory({
        spaceId: currentSpace.id,
        id: option.id,
        color: option.color,
        name: option.name
      });

      mutateForumCategories(
        (forumCategories) => {
          return forumCategories?.map((forumCategory) =>
            forumCategory.id === option.id ? updatedCategory : forumCategory
          );
        },
        { revalidate: false }
      );
    }
  }

  async function deleteForumCategory(option: PostCategory) {
    if (currentSpace) {
      await charmClient.forum.deletePostCategory({ id: option.id, spaceId: currentSpace.id });
      mutateForumCategories(
        (forumCategories) => {
          return forumCategories?.filter((forumCategory) => forumCategory.id !== option.id);
        },
        { revalidate: false }
      );
    }
  }

  return {
    createForumCategory,
    deleteForumCategory,
    updateForumCategory
  };
}
