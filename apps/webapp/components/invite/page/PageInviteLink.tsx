import { Alert } from '@mui/material';
import Card from '@mui/material/Card';

import { EmailAddressForm } from 'components/login/components/EmailAddressForm';

import { CenteredBox } from '../components/CenteredBox';

export type MagicLinkResponseStatus =
  | 'requesting_link'
  | 'sent_link'
  | 'verifying_email'
  | 'verified_email'
  | 'verifying_otp'
  | 'error'
  | 'error_invalid_code'
  | 'error_invalid_email'
  | 'error_invalid_page_id';

type InviteToPageProps = {
  email?: string;
  status?: MagicLinkResponseStatus;
  submitEmail: (email: string) => void;
};

export function PageInviteLink({ email, status, submitEmail }: InviteToPageProps) {
  return (
    <CenteredBox style={{ width: 500 }}>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <EmailAddressForm
          email={email || ''}
          loading={status === 'requesting_link'}
          title='Log in to view this document'
          description="Enter your email address and we'll email you a login link"
          handleSubmit={submitEmail}
        />
        {status === 'sent_link' && (
          <Alert sx={{ width: '100%' }} severity='success'>
            Magic link sent. Please check your inbox for {email}
          </Alert>
        )}
        {status === 'verifying_email' && (
          <Alert sx={{ width: '100%' }} severity='info'>
            Verifying email...
          </Alert>
        )}
        {status === 'verifying_otp' && (
          <Alert sx={{ width: '100%' }} severity='info'>
            Verifying otp...
          </Alert>
        )}
        {status === 'verified_email' && (
          <Alert sx={{ width: '100%' }} severity='info'>
            Redirecting...
          </Alert>
        )}
        {status === 'error' && (
          <Alert sx={{ width: '100%' }} severity='error'>
            Something went wrong. Please try again
          </Alert>
        )}
        {status === 'error_invalid_email' && (
          <Alert sx={{ width: '100%' }} severity='error'>
            Email is invalid
          </Alert>
        )}
        {status === 'error_invalid_code' && (
          <Alert sx={{ width: '100%' }} severity='warning'>
            This link has been used. Please request a new one.
          </Alert>
        )}
      </Card>
    </CenteredBox>
  );
}
