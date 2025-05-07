import type { EASAttestationFromApi } from '@packages/credentials/external/getOnchainCredentials';
import type { GnosisSafeTransactionToIndex } from '@packages/credentials/indexGnosisSafeCredentialTransaction';
import type { ProposalCredentialsToIndex } from '@packages/credentials/indexOnChainProposalCredential';
import type { RewardCredentialsToIndex } from '@packages/credentials/indexOnChainRewardCredential';
import type { CreateCredentialTemplateInput, CredentialTemplateUpdate } from '@packages/credentials/templates';
import * as http from '@packages/adapters/http';

export class CredentialsApi {
  // TODO Test endpoint for generating a credential - remove later
  attest(data: any): Promise<EASAttestationFromApi> {
    return http.POST(`/api/credentials`, data);
  }

  createCredentialTemplate(data: CreateCredentialTemplateInput) {
    return http.POST(`/api/credentials/templates`, data);
  }

  updateCredentialTemplate({ fields, templateId }: CredentialTemplateUpdate) {
    return http.PUT(`/api/credentials/templates?templateId=${templateId}`, fields);
  }

  deleteCredentialTemplate(templateId: string) {
    return http.DELETE(`/api/credentials/templates?templateId=${templateId}`);
  }

  requestProposalCredentialIndexing(data: ProposalCredentialsToIndex) {
    return http.POST(`/api/credentials/proposals/request-indexing`, data);
  }

  requestPendingCredentialGnosisSafeIndexing(data: GnosisSafeTransactionToIndex) {
    return http.POST(`/api/credentials/request-gnosis-safe-indexing`, data);
  }

  requestRewardCredentialIndexing(data: RewardCredentialsToIndex) {
    return http.POST(`/api/credentials/rewards/request-indexing`, data);
  }
}
