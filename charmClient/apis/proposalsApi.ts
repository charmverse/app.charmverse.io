import type { ProposalStatus } from '@prisma/client';
import * as http from 'adapters/http';
import type { IPageWithPermissions } from 'lib/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';

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

  createProposalTemplate ({ spaceId }: {spaceId: string}): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/templates', { spaceId });
  }

  createProposalFromTemplate ({ spaceId, templateId }: Omit<CreateProposalFromTemplateInput, 'createdBy'>): Promise<IPageWithPermissions> {
    return http.POST('/api/proposals/from-template', { spaceId, templateId });
  }

  deleteProposalTemplate ({ proposalTemplateId }: {proposalTemplateId: string}): Promise<IPageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
  }
}
