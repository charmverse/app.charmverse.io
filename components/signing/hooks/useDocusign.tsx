import { useState } from 'react';

import { DELETE } from 'adapters/http';
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
import type { DocusignSearchRequest } from 'pages/api/docusign/search';

/**
 * https://developers.docusign.com/platform/auth/reference/scopes/
 */
const scopes = ['impersonation', 'extended', 'signature', 'cors'];

export function useDocusign() {
  const { space } = useCurrentSpace();
  function docusignOauthUrl() {
    const redirectUri = encodeURIComponent(
      `${getCallbackDomain(typeof window === 'undefined' ? '' : window.location.hostname)}/api/docusign/callback`
    );

    const oauthUri = `${docusignOauthBaseUri}/oauth/auth?response_type=code&scope=${scopes.join(
      encodeURIComponent(' ')
    )}&client_id=${docusignClientId}&redirect_uri=${redirectUri}&state=${space?.id}`;

    return oauthUri;
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
    refreshDocusignProfile();
  }

  const {
    data: docusignTemplates,
    mutate: refreshDocusignTemplates,
    error: templateLoadingError
  } = useGetDocusignTemplates({ spaceId: space?.id });

  return {
    docusignOauthUrl,
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
    disconnectDocusign
  };
}
