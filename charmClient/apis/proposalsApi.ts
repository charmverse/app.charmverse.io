import type { PageWithPermissions } from '@charmverse/core/pages';

import * as http from 'adapters/http';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { ProposalWithUsers, ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { ReviewEvaluationRequest } from 'lib/proposal/submitEvaluationResult';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { UpdateEvaluationRequest } from 'lib/proposal/updateProposalEvaluation';
import type { UpdateProposalLensPropertiesRequest } from 'lib/proposal/updateProposalLensProperties';

export class ProposalsApi {
  /** @deprecated - use hooks instead */
  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT(`/api/proposals/${proposalId}`, rest);
  }

  /** @deprecated use hooks instead */
  getProposal(proposalId: string) {
    return http.GET<ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}`);
  }

  updateProposalLensProperties({ proposalId, ...rest }: UpdateProposalLensPropertiesRequest) {
    return http.PUT(`/api/proposals/${proposalId}/update-lens-properties`, rest);
  }

  archiveProposal({ archived, proposalId }: ArchiveProposalRequest) {
    return http.POST<ProposalWithUsers>(`/api/proposals/${proposalId}/archive`, { archived });
  }

  deleteProposalTemplate({ proposalTemplateId }: { proposalTemplateId: string }): Promise<PageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
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
}
