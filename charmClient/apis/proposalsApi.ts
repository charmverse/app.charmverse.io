import { ProposalStatus } from '@prisma/client';
import * as http from 'adapters/http';
import { ProposalWithUsers } from 'lib/proposal/interface';

export interface UpdateProposalRequest {
  authors: string[]
  reviewers: {
    group: 'role' | 'user'
    id: string
  }[]
}

export class ProposalsApi {
  updateProposal (proposalId: string, data: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, data);
  }

  getProposal (proposalId: string) {
    return http.GET<ProposalWithUsers>(`/api/proposals/${proposalId}`);
  }

  updateStatus (proposalId: string, newStatus: ProposalStatus) {
    return http.PUT(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  getProposalsBySpace (spaceId: string) {
    return http.GET(`/api/space/${spaceId}/proposals`);
  }
}
