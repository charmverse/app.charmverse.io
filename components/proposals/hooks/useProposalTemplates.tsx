import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useGetProposalTemplatesBySpace } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { useProposalCategories } from './useProposalCategories';

export function useProposalTemplates({ load } = { load: true }) {
  const { proposalCategoriesWithCreatePermission } = useProposalCategories();
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();

  const {
    data: proposalTemplates,
    mutate,
    isLoading: isLoadingTemplates
  } = useGetProposalTemplatesBySpace(load ? space?.id : null);
  const usableTemplates = isAdmin
    ? proposalTemplates
    : proposalTemplates?.filter((template) =>
        proposalCategoriesWithCreatePermission.some((c) => c.id === template.categoryId)
      );

  const deleteProposalTemplate = useCallback(
    async (templateId: string) => {
      await charmClient.deletePage(templateId);
      mutate((templates) => templates?.filter((p) => p.id !== templateId) ?? []);
    },
    [mutate]
  );

  return {
    proposalTemplates: usableTemplates,
    proposalTemplatePages: usableTemplates?.map((t) => t.page),
    deleteProposalTemplate,
    isLoadingTemplates
  };
}
