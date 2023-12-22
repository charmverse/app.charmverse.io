import type { PageWithPermissions } from '@charmverse/core/pages';
import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import * as http from 'adapters/http';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { ProposalCategory, ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

export class ProposalsApi {
  /** @deprecated - use hooks instead */
  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, rest);
  }

  /** @deprecated use hooks instead */
  getProposal(proposalId: string) {
    return http.GET<ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}`);
  }

  updateProposalLensProperties({ proposalId, ...rest }: UpdateProposalLensPropertiesRequest) {
    return http.PUT(`/api/proposals/${proposalId}/update-lens-properties`, rest);
  }

  updateStatus(proposalId: string, newStatus: ProposalStatus) {
    return http.PUT<ProposalWithUsers>(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  archiveProposal({ archived, proposalId }: ArchiveProposalRequest) {
    return http.POST<ProposalWithUsers>(`/api/proposals/${proposalId}/archive`, { archived });
  }

  deleteProposalTemplate({ proposalTemplateId }: { proposalTemplateId: string }): Promise<PageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
  }

  createProposalCategory(spaceId: string, category: Omit<ProposalCategory, 'id' | 'spaceId'>) {
    return http.POST<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories`, { ...category });
  }

  updateProposalCategory(spaceId: string, category: ProposalCategory) {
    return http.PUT<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories/${category.id}`, {
      ...category
    });
  }

  deleteProposalCategory(spaceId: string, categoryId: string) {
    return http.DELETE<{ ok: true }>(`/api/spaces/${spaceId}/proposal-categories/${categoryId}`);
  }
}
