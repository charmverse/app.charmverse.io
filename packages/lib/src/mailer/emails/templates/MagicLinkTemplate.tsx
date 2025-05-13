import { Row } from '@react-email/row';

import { Button, EmailWrapper, Text } from './components';

export type MagicLinkProps = {
  // geneate URL: https://blog.logrocket.com/send-custom-email-templates-firebase-react-express/#generate-email-verification-link
  magicLink: string;
  emailBranding?: {
    artwork: string;
    color: string;
  };
};

export function MagicLinkTemplate({ magicLink, emailBranding }: MagicLinkProps) {
  return (
    <EmailWrapper emailBranding={emailBranding} title='Verify your email address'>
      <Text variant='h2'>Verify your email address</Text>
      <Text>Thanks for signing up with us. Click on the button below to verify your email address.</Text>
      <Row
        style={{
          marginBottom: 20
        }}
      >
        <Button
          primaryColor={emailBranding?.color}
          style={{
            width: 'fit-content'
          }}
          href={magicLink}
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
