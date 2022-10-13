import type { ProposalStatus } from '@prisma/client';

import * as http from 'adapters/http';
import type { IPageWithPermissions } from 'lib/pages';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import type { ProposalCategory, ProposalWithUsers } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

export class ProposalsApi {
  updateProposal ({ proposalId, authors, reviewers, categoryId }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, { authors, reviewers, categoryId });
  }

  getProposal (proposalId: string) {
    return http.GET<ProposalWithUsers>(`/api/proposals/${proposalId}`);
  }

  updateStatus (proposalId: string, newStatus: ProposalStatus) {
    return http.PUT<ProposalWithUsers>(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  getProposalsBySpace (spaceId: string) {
    return http.GET<ProposalWithUsers[]>(`/api/spaces/${spaceId}/proposals`);
  }

  getProposalCategories (spaceId: string) {
    return http.GET<ProposalCategory[]>(`/api/spaces/${spaceId}/proposal-categories`);
  }

  createProposalTemplate ({ spaceId }: { spaceId: string }): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/templates', { spaceId });
  }

  createProposalFromTemplate ({ spaceId, templateId }: Omit<CreateProposalFromTemplateInput, 'createdBy'>): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/from-template', { spaceId, templateId });
  }

  deleteProposalTemplate ({ proposalTemplateId }: { proposalTemplateId: string }): Promise<IPageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
  }

  createProposalCategory (spaceId: string, category: Omit<ProposalCategory, 'id' | 'spaceId'>) {
    return http.POST<ProposalCategory>(`/api/spaces/${spaceId}/proposal-categories`, { ...category });
  }

  updateProposalCategory (spaceId: string, category: ProposalCategory) {
    return http.PUT<ProposalCategory>(`/api/spaces/${spaceId}/proposal-categories/${category.id}`, { ...category });
  }

  deleteProposalCategory (spaceId: string, categoryId: string) {
    return http.DELETE<{ ok: true }>(`/api/spaces/${spaceId}/proposal-categories/${categoryId}`);
  }
}
