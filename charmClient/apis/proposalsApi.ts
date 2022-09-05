import { ProposalStatus } from '@prisma/client';
import * as http from 'adapters/http';
import { AssignablePermissionGroups } from 'lib/permissions/interfaces';
import { ProposalReviewerInput, ProposalWithUsers, UpdateProposalRequest } from 'lib/proposal/interface';

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
}
