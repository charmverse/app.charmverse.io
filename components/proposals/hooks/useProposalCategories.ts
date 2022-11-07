import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useIsAdmin from 'hooks/useIsAdmin';
import type { NewProposalCategory } from 'lib/proposal/interface';

export function useProposalCategories () {
  const currentSpace = useCurrentSpace();
  // Might need better ACL in the future
  const canEditProposalCategories = useIsAdmin();

  const { data: categories, mutate } = useSWR(() => currentSpace
    ? `proposals/${currentSpace.id}/categories` : null, () => charmClient.proposals.getProposalCategories(currentSpace!.id));

  async function addCategory (category: NewProposalCategory) {
    const newCategory = await charmClient.proposals.createProposalCategory(currentSpace!.id, category);

    mutate(data => data ? [...data, newCategory] : [newCategory]);

    return newCategory;
  }

  async function deleteCategory (categoryId: string) {
    await charmClient.proposals.deleteProposalCategory(currentSpace!.id, categoryId);

    mutate(data => data ? data.filter(c => c.id !== categoryId) : undefined);

    return categoryId;
  }

  return { isLoading: !categories, categories, canEditProposalCategories, addCategory, deleteCategory };
}
