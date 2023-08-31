import { log } from '@charmverse/core/log';
import Card from '@mui/material/Card';
import { useRef, useState } from 'react';

import { CollectEmail } from 'components/login/CollectEmail';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useSnackbar } from 'hooks/useSnackbar';

import { CenteredBox } from '../components/CenteredBox';

type InviteToPageProps = {
  email?: string;
};

type MagicLinkResponseStatus = 'loading' | 'sent' | 'error' | 'error-invalid-email';

function useMagicLink() {
  const { requestMagicLinkViaFirebase } = useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const { showMessage } = useSnackbar();
  const [status, setStatus] = useState<MagicLinkResponseStatus | undefined>();

  async function handleMagicLinkRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      try {
        await requestMagicLinkViaFirebase({ email, redirectUrl: window.location.pathname });
        setStatus('sent');
      } catch (error) {
        if ((error as any)?.code === 'auth/invalid-email') {
          showMessage('Try another email address', 'error');
        } else {
          log.error('Error requesting firebase magic link', { error });
          showMessage('There was a problem. Please try again later', 'error');
        }
      } finally {
        sendingMagicLink.current = false;
      }
    }
  }

  const isLoading = sendingMagicLink.current === true;
  return {
    handleMagicLinkRequest,
    status: isLoading ? 'loading' : status
  };
}
export function InviteToPage({ email }: InviteToPageProps) {
  const { handleMagicLinkRequest, status } = useMagicLink();
  return (
    <CenteredBox>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <CollectEmail
          email={email || ''}
          loading={status === 'loading'}
          title='Log in to view this document'
          description="Enter your email address and we'll email you a login link"
          handleSubmit={handleMagicLinkRequest}
        />
      </Card>
    </CenteredBox>
  );
}
