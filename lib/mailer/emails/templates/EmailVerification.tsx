import { Row } from '@react-email/row';

import { Button, EmailWrapper, Text } from './components';

export type EmailVerificationProps = {
  // geneate URL: https://blog.logrocket.com/send-custom-email-templates-firebase-react-express/#generate-email-verification-link
  verificationUrl: string;
};

export function EmailVerification({ verificationUrl }: EmailVerificationProps) {
  return (
    <EmailWrapper title='Verify your email address'>
      <Text variant='h2'>Verify your email address</Text>
      <Text>Thanks for signing up with us. Click on the button below to verify your email address.</Text>
      <Row
        style={{
          marginBottom: 20
        }}
      >
        <Button
          variant='outlined'
          style={{
            width: 'fit-content'
          }}
          href={verificationUrl}
        >
          Verify your email
        </Button>
        <Text>If this email wasn't intended for you, feel free to delete it.</Text>
      </Row>
    </EmailWrapper>
  );
}

export function emailSubject() {
  return `Verify your email address`;
}
