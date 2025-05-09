import { DELETE, GET, POST, PUT } from '@packages/adapters/http';
import { useState } from 'react';

import {
  useGetDocusignAccounts,
  useGetDocusignProfile,
  useGetSearchSpaceDocusignEnvelopes,
  useGetSpaceDocusignEnvelopes
} from 'charmClient/hooks/docusign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { EvaluationDocumentToSign } from '@packages/lib/proposals/documentsToSign/addEnvelopeToEvaluation';
import type { DocusignSearchRequest } from 'pages/api/docusign/search';

export function useDocusign() {
  const { space } = useCurrentSpace();

  async function connectDocusignAccount() {
    const redirectUri = await GET('/api/docusign/request-oauth-url', { spaceId: space?.id });

    window.location.href = redirectUri.url;
  }

  const { data: docusignProfile, mutate: refreshDocusignProfile } = useGetDocusignProfile({ spaceId: space?.id });

  // const { trigger: requestSigningLink } = usePostRequestDocusignLink();

  const [docusignQuery, setDocusignQuery] = useState<DocusignSearchRequest | null>(null);

  const { data: envelopes, mutate: refreshEnvelopes } = useGetSpaceDocusignEnvelopes({ spaceId: space?.id });

  const {
    data: envelopeSearchResults,
    mutate: refreshEnvelopeSearchResults,
    isLoading: isSearchingEnvelopes,
    error: envelopeSearchError
  } = useGetSearchSpaceDocusignEnvelopes(docusignQuery);

  const { data: availableDocusignAccounts } = useGetDocusignAccounts({ spaceId: space?.id });

  async function updateSelectedDocusignAccount(input: { spaceId: string; docusignAccountId: string }) {
    await PUT('/api/docusign/accounts', input);
    refreshDocusignProfile();
  }

  function searchDocusign(query: DocusignSearchRequest) {
    setDocusignQuery(query);
    refreshEnvelopeSearchResults();
  }

  async function disconnectDocusign() {
    await DELETE('/api/docusign/disconnect', { spaceId: space?.id });
    refreshDocusignProfile(null);
  }

  // const {
  //   data: docusignTemplates,
  //   mutate: refreshDocusignTemplates,
  //   error: templateLoadingError
  // } = useGetDocusignTemplates({ spaceId: space?.id });

  async function addDocumentToEvaluation({ envelopeId, evaluationId }: EvaluationDocumentToSign) {
    await POST(`/api/proposals/evaluations/${evaluationId}/documents`, { envelopeId });
  }

  async function removeDocumentFromEvaluation({ envelopeId, evaluationId }: EvaluationDocumentToSign) {
    await DELETE(`/api/proposals/evaluations/${evaluationId}/documents`, { envelopeId });
  }

  return {
    connectDocusignAccount,
    docusignProfile,
    refreshDocusignProfile,
    envelopes,
    refreshEnvelopes,
    isSearchingEnvelopes,
    envelopeSearchResults,
    searchDocusign,
    envelopeSearchError,
    disconnectDocusign,
    addDocumentToEvaluation,
    removeDocumentFromEvaluation,
    availableDocusignAccounts,
    updateSelectedDocusignAccount
  };
}
