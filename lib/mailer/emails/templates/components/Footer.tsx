import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Container } from '@react-email/container';
import type { ReactNode } from 'react';

import { greyColor2 } from 'theme/colors';

import Link from './Link';
import Text from './Text';

export default function Footer({ showSnooze = true }: { showSnooze?: boolean }) {
  const unsubscribeLink = `${process.env.DOMAIN}/?account=true`;

  return (
    <>
      <Container
        style={{
          marginTop: 20,
          textAlign: 'center'
        }}
      >
        <SocialIcon href='https://www.linkedin.com/company/charmverse'>
          <LinkedInIcon />
        </SocialIcon>
        <SocialIcon href='https://twitter.com/charmverse'>
          <TwitterIcon />
        </SocialIcon>
        <SocialIcon href='https://www.facebook.com/charmverse.io'>
          <FacebookIcon />
        </SocialIcon>
      </Container>

      {showSnooze && (
        <Container
          style={{
            textAlign: 'center'
          }}
        >
          <Text variant='caption'>
            <Link href={unsubscribeLink} style={{ textDecoration: 'underline', color: 'inherit' }}>
              Disable or Snooze
            </Link>{' '}
            notifications from CharmVerse
          </Text>
        </Container>
      )}
    </>
  );
}

function SocialIcon(props: { children: ReactNode; href: string }) {
  return (
    <Link style={{ padding: '0 5px', color: greyColor2 }} href={props.href} rel='noreferrer'>
      {props.children}
    </Link>
  );
}
