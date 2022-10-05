import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import {
  MjmlColumn, MjmlSection, MjmlText
} from 'mjml-react';
import type { ReactNode } from 'react';

import { greyColor2 } from 'theme/colors';

export default function Footer () {

  const unsubscribeLink = `${process.env.DOMAIN}/nexus`;

  return (
    <>
      <MjmlSection borderTop='2px solid #eee' paddingBottom={0}>
        <MjmlColumn>
          <MjmlText align='center'>
            <SocialIcon href='https://www.linkedin.com/company/charmverse'>
              <LinkedInIcon />
            </SocialIcon>
            <SocialIcon href='https://twitter.com/charmverse'>
              <TwitterIcon />
            </SocialIcon>
            <SocialIcon href='https://www.facebook.com/charmverse.io'>
              <FacebookIcon />
            </SocialIcon>
          </MjmlText>
        </MjmlColumn>
      </MjmlSection>

      <MjmlSection paddingTop={0}>
        <MjmlColumn>
          <MjmlText align='center' color={greyColor2} fontSize={12}>
            <a href={unsubscribeLink} style={{ textDecoration: 'underline', color: 'inherit' }}>
              Disable or Snooze
            </a> notifications from CharmVerse
          </MjmlText>
        </MjmlColumn>
      </MjmlSection>
    </>
  );
}

function SocialIcon (props: { children: ReactNode, href: string }) {
  return (
    <a style={{ padding: '0 5px', color: greyColor2 }} href={props.href} rel='noreferrer'>
      {props.children}
    </a>
  );
}

