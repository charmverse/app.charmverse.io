import type { PostCategory } from '@prisma/client';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useSpaces } from './useSpaces';

export function useForumCategories() {
  const currentSpace = useCurrentSpace();
  const { setSpace } = useSpaces();

  const {
    data: categories,
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

  async function setDefaultPostCategory(option: PostCategory) {
    if (currentSpace) {
      const updatedSpace = await charmClient.forum.setDefaultPostCategory({
        postCategoryId: option.id,
        spaceId: currentSpace.id
      });
      setSpace(updatedSpace);
    }
  }

  return {
    createForumCategory,
    deleteForumCategory,
    updateForumCategory,
    setDefaultPostCategory,
    isCategoriesLoaded: !!categories,
    categories: categories || [],
    error,
    disabled: isValidating
  };
}
