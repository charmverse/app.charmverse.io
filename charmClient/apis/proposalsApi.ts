import * as http from 'adapters/http';
import { UpdateProposalRequest } from 'lib/proposal/interface';

export class ProposalsApi {
  updateProposal (proposalId: string, data: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, data);
  }
}
