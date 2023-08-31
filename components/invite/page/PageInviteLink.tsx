import { Alert } from '@mui/material';
import Card from '@mui/material/Card';

import { CollectEmail } from 'components/login/CollectEmail';

import { CenteredBox } from '../components/CenteredBox';

export type MagicLinkResponseStatus =
  | 'requesting-link'
  | 'sent-link'
  | 'verifying-email'
  | 'verified-email'
  | 'error'
  | 'error-invalid-code'
  | 'error-invalid-email';

type InviteToPageProps = {
  email?: string;
  status?: MagicLinkResponseStatus;
  submitEmail: (email: string) => void;
};
export function PageInviteLink({ email, status, submitEmail }: InviteToPageProps) {
  return (
    <CenteredBox style={{ width: 500 }}>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <CollectEmail
          email={email || ''}
          loading={status === 'requesting-link'}
          title='Log in to view this document'
          description="Enter your email address and we'll email you a login link"
          handleSubmit={submitEmail}
        />
        {status === 'sent-link' && (
          <Alert sx={{ width: '100%' }} severity='success'>
            Magic link sent. Please check your inbox for {email}
          </Alert>
        )}
        {status === 'verifying-email' && (
          <Alert sx={{ width: '100%' }} severity='info'>
            Verifying email...
          </Alert>
        )}
        {status === 'verified-email' && (
          <Alert sx={{ width: '100%' }} severity='info'>
            Redirecting...
          </Alert>
        )}
        {status === 'error' && (
          <Alert sx={{ width: '100%' }} severity='error'>
            Something went wrong. Please try again
          </Alert>
        )}
        {status === 'error-invalid-email' && (
          <Alert sx={{ width: '100%' }} severity='error'>
            Email is invalid
          </Alert>
        )}
        {status === 'error-invalid-code' && (
          <Alert sx={{ width: '100%' }} severity='warning'>
            This link has been used. Please request a new one.
          </Alert>
        )}
      </Card>
    </CenteredBox>
  );
}
