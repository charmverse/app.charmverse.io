import type { PostCategoryWithPermissions } from '@charmverse/core/permissions';
import type { PostCategory } from '@charmverse/core/prisma';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';
import useSWR from 'swr/immutable';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';
import { useSpaces } from './useSpaces';
import { useUser } from './useUser';

type IContext = {
  createForumCategory: (categoryName: string) => Promise<void>;
  deleteForumCategory: (option: { id: string }) => Promise<void>;
  updateForumCategory: (option: PostCategory) => Promise<PostCategoryWithPermissions | undefined>;
  setDefaultPostCategory: (option: PostCategory) => Promise<void>;
  getForumCategoryById: (id?: string | null) => PostCategoryWithPermissions | undefined;
  getPostableCategories: () => PostCategoryWithPermissions[];
  isLoading: boolean;
  categories: PostCategoryWithPermissions[];
  error: any;
  disabled: boolean;
};

export const PostCategoriesContext = createContext<Readonly<IContext>>({
  createForumCategory: () => Promise.resolve(undefined as any),
  deleteForumCategory: () => Promise.resolve(undefined),
  updateForumCategory: () => Promise.resolve(undefined),
  setDefaultPostCategory: () => Promise.resolve(undefined),
  getForumCategoryById: () => undefined,
  getPostableCategories: () => [],
  isLoading: false,
  categories: [],
  error: undefined,
  disabled: false
});

export function PostCategoriesProvider({ children }: { children: ReactNode }) {
  const { space: currentSpace } = useCurrentSpace();
  const { setSpace } = useSpaces();

  const { user } = useUser();
  const {
    data: categories,
    error,
    isValidating,
    mutate: mutateForumCategories
  } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories/${user?.id ?? 'anonymous'}` : null, () =>
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

  async function deleteForumCategory(option: { id: string }) {
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

  function getForumCategoryById(id?: string | null) {
    if (!id) {
      return undefined;
    }
    return categories?.find((category) => category.id === id);
  }

  function getPostableCategories() {
    return (categories ?? []).filter((c) => c.permissions.create_post);
  }

  const value = useMemo<IContext>(
    () => ({
      createForumCategory,
      deleteForumCategory,
      updateForumCategory,
      setDefaultPostCategory,
      getForumCategoryById,
      getPostableCategories,
      isLoading: !categories,
      categories: categories || [],
      error,
      disabled: isValidating
    }),
    [error, categories, isValidating, currentSpace]
  );

  return <PostCategoriesContext.Provider value={value}>{children}</PostCategoriesContext.Provider>;
}

export const useForumCategories = () => useContext(PostCategoriesContext);
