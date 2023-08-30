import Card from '@mui/material/Card';
import { useRef, useState } from 'react';

import { CollectEmail } from 'components/login/CollectEmail';
import { useFirebaseAuth } from 'hooks/useFirebaseAuth';
import { useUser } from 'hooks/useUser';

import { CenteredBox } from '../components/CenteredBox';

type InviteToPageProps = {
  email?: string;
};

function useMagicLink() {
  const { requestMagicLinkViaFirebase } = useFirebaseAuth();
  const sendingMagicLink = useRef(false);
  const [status, setStatus] = useState<'loading' | 'sent' | 'error' | undefined>();
  async function handleMagicLinkRequest(email: string) {
    if (sendingMagicLink.current === false) {
      sendingMagicLink.current = true;
      // console.log('Handling magic link request');
      try {
        await requestMagicLinkViaFirebase({ email, redirectUrl: '' });
        setStatus('sent');
      } catch (err) {
        setStatus('error');
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
