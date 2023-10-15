import { MjmlColumn, MjmlSection, MjmlText } from 'mjml-react';

import { baseUrl } from 'config/constants';

import { Button, EmailWrapper } from './components';

export type PageInviteEmailProps = {
  guestEmail: string;
  invitingUserName: string;
  pageTitle: string;
  pageId: string;
};

const pageContainerStyle = {
  lineHeight: '120%',
  textDecoration: 'none',
  borderRadius: '30px',
  border: '1px solid #ccc',
  fontWeight: '600',
  padding: '10px 30px'
};

export function PageInviteEmail(props: PageInviteEmailProps) {
  const pageLink = `${baseUrl}/invite/page?id=${props.pageId}&email=${encodeURIComponent(props.guestEmail)}`;

  return (
    <EmailWrapper title={`${props.invitingUserName} shared a document`}>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <MjmlText paddingBottom={40} paddingTop={0}>
            <p>
              {props.invitingUserName} has invited you to <b>view</b> the following document:
            </p>
            <br />
            <a href={pageLink} style={pageContainerStyle}>
              {props.pageTitle}
            </a>
          </MjmlText>
          <Button paddingBottom={40} align='left' href={pageLink}>
            Open
          </Button>
        </MjmlColumn>
      </MjmlSection>
    </EmailWrapper>
  );
}

export function emailSubject({ pageTitle }: PageInviteEmailProps) {
  return `Document shared with you: "${pageTitle}"`;
}
