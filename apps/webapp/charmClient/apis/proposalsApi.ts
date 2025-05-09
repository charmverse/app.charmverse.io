import * as http from '@packages/adapters/http';

import { MaybeString } from 'charmClient/hooks/helpers';
import type { ProposalWithUsersAndRubric } from '@packages/lib/proposals/interfaces';
import type { ReviewEvaluationRequest } from '@packages/lib/proposals/submitEvaluationResult';
import type { UpdateProposalRequest } from '@packages/lib/proposals/updateProposal';
import type { UpdateEvaluationRequest } from '@packages/lib/proposals/updateProposalEvaluation';

export class ProposalsApi {
  /** @deprecated - use hooks instead */
  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, rest);
  }

  /** @deprecated use hooks instead */
  getProposal(proposalId: string) {
    return http.GET<ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}`);
  }

  updateProposalEvaluation({ proposalId, ...payload }: UpdateEvaluationRequest) {
    return http.PUT(`/api/proposals/${proposalId}/evaluation`, payload);
  }

  submitEvaluationResult({ proposalId, ...payload }: Omit<ReviewEvaluationRequest, 'decidedBy'>) {
    return http.PUT(`/api/proposals/${proposalId}/submit-result`, payload);
  }

  publishProposal(proposalId: string) {
    return http.PUT(`/api/proposals/${proposalId}/publish`);
  }

  createProposalRewards({ proposalId }: { proposalId: string }) {
    return http.POST(`/api/proposals/${proposalId}/rewards`);
  }

  goBackToStep({ proposalId, ...payload }: { proposalId: string; evaluationId?: string }) {
    return http.PUT(`/api/proposals/${proposalId}/back-to-step`, payload);
  }

  exportProposalsReviewers({ spaceId }: { spaceId: string }) {
    return http.GET<string>(`/api/spaces/${spaceId}/proposals/reviewers/export`);
  }

  exportUserProposals({ spaceId }: { spaceId: string }) {
    return http.GET<string>(`/api/spaces/${spaceId}/proposals/my-work/export`);
  }

  exportFilteredProposals({ spaceId }: { spaceId: string }) {
    return http.GET<string>(`/api/spaces/${spaceId}/proposals/export`);
  }
}
