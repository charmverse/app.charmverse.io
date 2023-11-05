import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';

import charmClient from 'charmClient';
import { useGetProposalCategories } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { NewProposalCategory } from 'lib/proposal/interface';

export function useProposalCategories() {
  const { space: currentSpace } = useCurrentSpace();
  // Might need better ACL in the future
  const { data: categories, mutate } = useGetProposalCategories(currentSpace?.id);

  async function addCategory(category: NewProposalCategory) {
    const newCategory = await charmClient.proposals.createProposalCategory(currentSpace!.id, category);

    mutate((data) => (data ? [...data, newCategory] : [newCategory]));

    return newCategory;
  }

  async function deleteCategory(categoryId: string) {
    await charmClient.proposals.deleteProposalCategory(currentSpace!.id, categoryId);

    mutate((data) => (data ? data.filter((c) => c.id !== categoryId) : undefined));

    return categoryId;
  }

  function mutateCategory(category: ProposalCategoryWithPermissions) {
    mutate((data) => {
      const copied = data?.slice() ?? [];
      const existingCategoryIndex = copied.findIndex((c) => c.id === category.id);

      if (existingCategoryIndex) {
        copied.push();
      } else {
        copied[existingCategoryIndex] = category;
      }
      return copied;
    });
  }

  const proposalCategoriesWithCreatePermission = (categories ?? [])?.filter((c) => c.permissions.create_proposal);

  function getDefaultCreateCategory() {
    const firstDefault = proposalCategoriesWithCreatePermission.find((c) => c.title === 'General');
    if (firstDefault) {
      return firstDefault;
    }
    return proposalCategoriesWithCreatePermission[0];
  }

  return {
    isLoading: !categories,
    categories,
    addCategory,
    deleteCategory,
    mutateCategory,
    proposalCategoriesWithCreatePermission,
    getDefaultCreateCategory
  };
}
