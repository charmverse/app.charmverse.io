import { MjmlSection, MjmlColumn, MjmlGroup, MjmlText, MjmlImage } from 'mjml-react';

import { charmverseDiscordInvite } from 'config/constants';

const domain = process.env.DOMAIN;
const chatIconPath = '/images/icons/speech-bubbles.png';

export default function Feedback() {
  return (
    <MjmlSection backgroundColor='#fff' paddingTop={40} paddingBottom={40}>
      <MjmlGroup>
        <MjmlColumn width='25%' paddingRight={0}>
          <MjmlImage paddingRight={0} align='center' height='47px' width='64px' src={`${domain}/${chatIconPath}`} />
        </MjmlColumn>
        <MjmlColumn width='75%'>
          <MjmlText paddingLeft={0}>
            <p>
              <strong>Do you have any feedback on this email?</strong>
            </p>
            <p>
              Please share it with us on <a href={charmverseDiscordInvite}>Discord</a>
            </p>
          </MjmlText>
        </MjmlColumn>
      </MjmlGroup>
    </MjmlSection>
  );
}
