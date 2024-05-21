import { Button } from 'components/common/Button';
import { useDocusign } from 'components/signing/hooks/useDocusign';

export function ConnectDocusignAccount() {
  const {
    docusignOauthUrl,
    docusignProfile,
    docusignTemplates,
    refreshDocusignTemplates,
    templateLoadingError,
    triggerCreateEnvelope,
    envelopes,
    refreshEnvelopes,
    requestSigningLink,
    envelopeSearchResults,
    searchDocusign
  } = useDocusign();

  const oauthUrl = docusignOauthUrl();

  return (
    <Button href={oauthUrl} external>
      Connect Docusign
    </Button>
  );
}
