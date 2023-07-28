import { useForumCategories } from 'hooks/useForumCategories';

export function usePostCategoryPermissions(postCategoryId?: string | null) {
  const { getForumCategoryById } = useForumCategories();

  const permissions = getForumCategoryById(postCategoryId)?.permissions;

  return { permissions };
}
