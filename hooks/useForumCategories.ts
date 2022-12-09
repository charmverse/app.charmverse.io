import type { PostCategory } from '@prisma/client';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

export function useForumCategories() {
  const currentSpace = useCurrentSpace();

  const {
    data: categories = [],
    error,
    isValidating,
    mutate: mutateForumCategories
  } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(currentSpace!.id).then((_categories) =>
      _categories.sort((catA, catB) => {
        const first = catA.name.toLowerCase();
        const second = catB.name.toLowerCase();
        if (first < second) {
          return -1;
        } else if (second < first) {
          return 1;
        } else {
          return 0;
        }
      })
    )
  );

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
    updateForumCategory,
    categories,
    error,
    disabled: isValidating
  };
}
