import { ProposalReviewerGroup } from '@prisma/client';
import * as http from 'adapters/http';

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
}
