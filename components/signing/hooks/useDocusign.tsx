import {
  useGetDocusignProfile,
  useGetDocusignTemplates,
  useGetSpaceDocusignEnvelopes,
  usePostCreateEnvelope,
  usePostRequestDocusignLink
} from 'charmClient/hooks/docusign';
import { useGET } from 'charmClient/hooks/helpers';
import { docusignClientId, docusignOauthBaseUri } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getCallbackDomain } from 'lib/oauth/getCallbackDomain';

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

  const { trigger: triggerCreateEnvelope, data: createdEnvelope } = usePostCreateEnvelope();

  const { trigger: requestSigningLink } = usePostRequestDocusignLink();

  const { data: envelopes, mutate: refreshEnvelopes } = useGetSpaceDocusignEnvelopes({ spaceId: space?.id });

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
    triggerCreateEnvelope,
    createdEnvelope,
    envelopes,
    refreshEnvelopes,
    requestSigningLink
  };
}
