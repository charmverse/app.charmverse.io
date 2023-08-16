import type { PageWithPermissions } from '@charmverse/core/pages';
import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import * as http from 'adapters/http';
import type { PageWithProposal } from 'lib/pages';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import type { ProposalCategory } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

export class ProposalsApi {
  createProposal(input: Omit<CreateProposalInput, 'userId'>) {
    return http.POST<PageWithProposal>('/api/proposals', input);
  }

  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT<PageWithProposal>(`/api/proposals/${proposalId}`, rest);
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

  createProposalFromTemplate({
    spaceId,
    templateId
  }: Omit<CreateProposalFromTemplateInput, 'createdBy'>): Promise<PageWithPermissions> {
    return http.POST('/api/proposals/from-template', { spaceId, templateId });
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
