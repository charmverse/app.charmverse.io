import { MjmlColumn, MjmlSection, MjmlText } from 'mjml-react';

import { EmailWrapper, Feedback, Footer, Header } from './components';

export type AddedAsGuestProps = {
  invitingUserName: string;
  pageTitle: string;
  documentLinkWithSignin: string;
};

export function AddedAsGuest(props: AddedAsGuestProps) {
  return (
    <EmailWrapper title='Your open tasks'>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <Header />
        </MjmlColumn>
      </MjmlSection>
      <MjmlSection backgroundColor='#fff' paddingTop={0} paddingBottom={0}>
        <MjmlColumn>
          <MjmlText paddingBottom={0} paddingTop={0}>
            <p>Hello,</p>
            <p>
              {props.invitingUserName} shared the <b>{props.pageTitle}</b> document with you.
            </p>
            <p>
              Use this{' '}
              <a href={props.documentLinkWithSignin} target='_blank' rel='noreferrer'>
                one-time link
              </a>{' '}
              to access the document inside their CharmVerse space.
            </p>
          </MjmlText>
        </MjmlColumn>
      </MjmlSection>
      <Feedback />
      <Footer />
    </EmailWrapper>
  );
}

export function addedAsGuestTitle({ invitingUserName, pageTitle }: AddedAsGuestProps) {
  return `${invitingUserName} shared ${pageTitle} with you`;
}
