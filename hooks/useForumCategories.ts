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
        name: option.name,
        description: option.description
      });

      mutateForumCategories(
        (forumCategories) => {
          return forumCategories?.map((forumCategory) =>
            forumCategory.id === option.id ? updatedCategory : forumCategory
          );
        },
        { revalidate: false }
      );

      return updatedCategory;
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

  function getForumCategoryById(id: string) {
    return categories?.find((category) => category.id === id);
  }

  function getPostableCategories() {
    return (categories ?? []).filter((c) => c.permissions.create_post);
  }

  return {
    createForumCategory,
    deleteForumCategory,
    updateForumCategory,
    setDefaultPostCategory,
    getForumCategoryById,
    getPostableCategories,
    isCategoriesLoaded: !!categories,
    categories: categories || [],
    error,
    disabled: isValidating
  };
}
