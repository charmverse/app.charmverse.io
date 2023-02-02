import { useForumCategories } from 'hooks/useForumCategories';

export function usePostCategoryPermissions(postCategoryId: string) {
  const { getForumCategoryById } = useForumCategories();

  const permissions = getForumCategoryById(postCategoryId)?.permissions;

  return { permissions };
}
