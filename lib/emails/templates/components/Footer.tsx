import { ReactNode } from 'react';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import {
  MjmlText,
  MjmlSection,
  MjmlColumn,
  MjmlImage,
  MjmlSocial,
  MjmlSocialElement
} from 'mjml-react';
import { greyColor2 } from 'theme/colors';

export default function Footer () {

  const unsubscribeLink = `${process.env.DOMAIN}/profile/tasks`;

  return (
    <>
      <MjmlSection borderTop='2px solid #eee' paddingBottom={0}>
        <MjmlColumn>
          {/* <MjmlSocial align='center'>
        <MjmlSocialElement name='facebook'></MjmlSocialElement>
        <MjmlSocialElement name='pinterest'></MjmlSocialElement>
        <MjmlSocialElement name='instagram'></MjmlSocialElement>
      </MjmlSocial> */}
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
          {/* <a href='https://discord.gg/ACYCzBGC2M' target='_blank'>
            <SvgIcon viewBox='0 -5 70 70'><DiscordIcon /></SvgIcon>
          </a> */}
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

function SocialIcon (props: { children: ReactNode; href: string }) {
  return (
    <a style={{ padding: '0 5px', color: greyColor2 }} href={props.href} rel='noreferrer'>
      {props.children}
    </a>
  );
}

