import { useRouter } from 'next/router';
import { useState } from 'react';

import { DELETE, GET, POST } from 'adapters/http';
import {
  useGetDocusignProfile,
  useGetDocusignTemplates,
  useGetSearchSpaceDocusignEnvelopes,
  useGetSpaceDocusignEnvelopes,
  usePostRequestDocusignLink
} from 'charmClient/hooks/docusign';
import { docusignClientId, docusignOauthBaseUri } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';
import type { EvaluationDocumentToSign } from 'lib/proposals/documentsToSign/addEnvelopeToEvaluation';
import type { DocusignSearchRequest } from 'pages/api/docusign/search';

export function useDocusign() {
  const { space } = useCurrentSpace();

  const router = useRouter();

  async function connectDocusignAccount() {
    const redirectUri = await GET('/api/docusign/request-oauth-url', { spaceId: space?.id });

    router.push(redirectUri.url);
  }

  const { data: docusignProfile, mutate: refreshDocusignProfile } = useGetDocusignProfile({ spaceId: space?.id });

  const { trigger: requestSigningLink } = usePostRequestDocusignLink();

  const [docusignQuery, setDocusignQuery] = useState<DocusignSearchRequest | null>(null);

  const { data: envelopes, mutate: refreshEnvelopes } = useGetSpaceDocusignEnvelopes({ spaceId: space?.id });

  const {
    data: envelopeSearchResults,
    mutate: refreshEnvelopeSearchResults,
    isLoading: isSearchingEnvelopes
  } = useGetSearchSpaceDocusignEnvelopes(docusignQuery);

  function searchDocusign(query: DocusignSearchRequest) {
    setDocusignQuery(query);
    refreshEnvelopeSearchResults();
  }

  async function disconnectDocusign() {
    await DELETE('/api/docusign/disconnect', { spaceId: space?.id });
    refreshDocusignProfile(null);
  }

  const {
    data: docusignTemplates,
    mutate: refreshDocusignTemplates,
    error: templateLoadingError
  } = useGetDocusignTemplates({ spaceId: space?.id });

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
    docusignTemplates: docusignTemplates?.envelopeTemplates,
    refreshDocusignTemplates,
    templateLoadingError,
    envelopes,
    refreshEnvelopes,
    requestSigningLink,
    isSearchingEnvelopes,
    envelopeSearchResults,
    searchDocusign,
    disconnectDocusign,
    addDocumentToEvaluation,
    removeDocumentFromEvaluation
  };
}
