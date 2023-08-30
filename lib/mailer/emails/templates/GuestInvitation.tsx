import { MjmlColumn, MjmlSection, MjmlText } from 'mjml-react';

import { Button, EmailWrapper, Footer, Header } from './components';

export type GuestInvitationProps = {
  invitingUserName: string;
  pageTitle: string;
  pageLink: string;
};

const pageContainerStyle = {
  lineHeight: '120%',
  textDecoration: 'none',
  borderRadius: '30px',
  border: '1px solid #ccc',
  fontWeight: '600',
  padding: '10px 30px'
};

export function GuestInvitation(props: GuestInvitationProps) {
  return (
    <EmailWrapper title={`${props.invitingUserName} shared a document`}>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header size='small' />
        </MjmlColumn>
      </MjmlSection>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <MjmlText paddingBottom={40} paddingTop={0}>
            <p>
              {props.invitingUserName} has invited you to <b>view</b> the following document:
            </p>
            <br />
            <a href={props.pageLink} style={pageContainerStyle}>
              {props.pageTitle}
            </a>
          </MjmlText>
          <Button paddingBottom={40} align='left' href={props.pageLink}>
            Open
          </Button>
        </MjmlColumn>
      </MjmlSection>
      <Footer />
    </EmailWrapper>
  );
}

export function emailSubject({ invitingUserName, pageTitle }: GuestInvitationProps) {
  return `${invitingUserName} shared ${pageTitle} with you`;
}
