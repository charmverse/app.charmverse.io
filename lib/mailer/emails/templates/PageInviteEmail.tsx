import { Row } from '@react-email/row';

import { baseUrl } from 'config/constants';

import { Button, EmailWrapper, Text } from './components';

export type PageInviteEmailProps = {
  guestEmail: string;
  invitingUserName: string;
  pageTitle: string;
  pageId: string;
};

export function PageInviteEmail(props: PageInviteEmailProps) {
  const pageLink = `${baseUrl}/invite/page?id=${props.pageId}&email=${encodeURIComponent(props.guestEmail)}`;

  return (
    <EmailWrapper title={`${props.invitingUserName} shared a document`} headerSize='small'>
      <Text>
        {props.invitingUserName} has invited you to <b>view</b> the following document:
      </Text>
      <Row
        style={{
          marginBottom: 20
        }}
      >
        <Button variant='outlined' href={pageLink}>
          {props.pageTitle}
        </Button>
      </Row>
      <Button href={pageLink}>Open</Button>
    </EmailWrapper>
  );
}

export function emailSubject({ pageTitle }: PageInviteEmailProps) {
  return `Document shared with you: "${pageTitle}"`;
}
