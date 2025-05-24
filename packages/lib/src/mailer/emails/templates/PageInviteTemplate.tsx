import { baseUrl } from '@packages/config/constants';
import { Row } from '@react-email/row';

import { Button, EmailWrapper, Text } from './components';

export type PageInviteEmailProps = {
  guestEmail: string;
  invitingUserName: string;
  pageTitle: string;
  pageId: string;
  emailBranding?: {
    artwork: string;
    color: string;
  };
};

export function PageInviteTemplate(props: PageInviteEmailProps) {
  const pageLink = `${baseUrl}/invite/page?id=${props.pageId}&email=${encodeURIComponent(props.guestEmail)}`;

  return (
    <EmailWrapper emailBranding={props.emailBranding} title={`${props.invitingUserName} shared a document`}>
      <Text>
        {props.invitingUserName} has invited you to <b>view</b> the following document:
      </Text>
      <Row
        style={{
          marginBottom: 20
        }}
      >
        <Button
          primaryColor={props.emailBranding?.color}
          variant='outlined'
          style={{
            width: 'fit-content'
          }}
          href={pageLink}
        >
          {props.pageTitle}
        </Button>
      </Row>
      <Button
        primaryColor={props.emailBranding?.color}
        style={{
          width: 'fit-content'
        }}
        href={pageLink}
      >
        Open
      </Button>
    </EmailWrapper>
  );
}

export function emailSubject({ pageTitle }: PageInviteEmailProps) {
  return `Document shared with you: "${pageTitle}"`;
}
