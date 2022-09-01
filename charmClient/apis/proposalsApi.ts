import { ProposalReviewerGroup } from '@prisma/client';
import * as http from 'adapters/http';
import { ProposalWithUsers } from 'lib/proposal/interface';

export interface UpdateProposalRequest {
  authors: string[]
  reviewers: {
    group: ProposalReviewerGroup
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

  publishDraft (proposalId: string) {
    return http.PUT(`/api/proposals/${proposalId}/publish-draft`);
  }

  openDiscussion (proposalId: string) {
    return http.PUT(`/api/proposals/${proposalId}/open-discussion`);
  }
}
