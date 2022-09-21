import type { ProposalStatus } from '@prisma/client';
import * as http from 'adapters/http';
import type { ProposalCategory, ProposalWithUsers } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

export class ProposalsApi {
  updateProposal ({ proposalId, authors, reviewers }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, { authors, reviewers });
  }

  getProposal (proposalId: string) {
    return http.GET<ProposalWithUsers>(`/api/proposals/${proposalId}`);
  }

  updateStatus (proposalId: string, newStatus: ProposalStatus) {
    return http.PUT(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  getProposalsBySpace (spaceId: string) {
    return http.GET<ProposalWithUsers[]>(`/api/spaces/${spaceId}/proposals`);
  }

  getProposalCategories (spaceId: string) {
    return http.GET<ProposalCategory[]>(`/api/spaces/${spaceId}/categories`);
  }

  createProposalCategory (spaceId: string, category: Omit<ProposalCategory, 'id' | 'spaceId'>) {
    return http.POST<ProposalCategory[]>(`/api/spaces/${spaceId}/categories`, { ...category });
  }

  updateProposalCategory (spaceId: string, category: ProposalCategory) {
    return http.PUT<ProposalCategory[]>(`/api/spaces/${spaceId}/categories/${category.id}`, { ...category });
  }

  deleteProposalCategories (spaceId: string, categoryId: string) {
    return http.GET<ProposalCategory[]>(`/api/spaces/${spaceId}/categories/${categoryId}`);
  }
}
