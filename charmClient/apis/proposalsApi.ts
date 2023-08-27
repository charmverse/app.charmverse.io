import type { PageWithPermissions } from '@charmverse/core/pages';
import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalBlock, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import * as http from 'adapters/http';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { ProposalBlockInput, ProposalBlockUpdateInput } from 'lib/proposal/blocks/interfaces';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

export class ProposalsApi {
  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, rest);
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

  createProposalTemplate({
    spaceId,
    categoryId
  }: {
    spaceId: string;
    categoryId: string;
  }): Promise<PageWithPermissions> {
    return http.POST('/api/proposals/templates', { spaceId, categoryId });
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

  getProposalBlocks(spaceId: string) {
    return http.GET(`/api/spaces/${spaceId}/proposals/blocks`);
  }

  createProposalBlocks({ data, spaceId }: { data: ProposalBlockInput[]; spaceId: string }) {
    return http.POST(`/api/spaces/${spaceId}/proposals/blocks`, data);
  }

  updateProposalBlocks({ data, spaceId }: { data: ProposalBlockUpdateInput[]; spaceId: string }) {
    return http.PUT(`/api/spaces/${spaceId}/proposals/blocks`, data);
  }

  deleteProposalBlocks({ data, spaceId }: { data: string[]; spaceId: string }) {
    return http.DELETE(`/api/spaces/${spaceId}/proposals/blocks`, data);
  }
}
