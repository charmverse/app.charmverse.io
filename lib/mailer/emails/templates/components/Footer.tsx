import { Column } from '@react-email/column';
import { Container } from '@react-email/container';
import { Img } from '@react-email/img';
import { baseUrl } from '@root/config/constants';
import type { ReactNode } from 'react';

import Link from './Link';
import Text from './Text';

export default function Footer({ showSnooze = true }: { showSnooze?: boolean }) {
  const unsubscribeLink = `${process.env.DOMAIN}/?account=true`;

  return (
    <>
      <Container
        style={{
          margin: '20px auto 0px auto',
          width: '100px'
        }}
      >
        <Column width={30}>
          <SocialIcon href='https://www.linkedin.com/company/charmverse'>
            <Img width={20} height={20} src={`${baseUrl}/images/logos/linkedin_greyscale.png`} />
          </SocialIcon>
        </Column>
        <Column width={30}>
          <SocialIcon href='https://x.com/charmverse'>
            <Img width={21} height={21} src={`${baseUrl}/images/logos/x_greyscale.png`} />
          </SocialIcon>
        </Column>
        <Column width={30}>
          <SocialIcon href='https://www.facebook.com/charmverse.io'>
            <Img width={20} height={20} src={`${baseUrl}/images/logos/facebook_greyscale.png`} />
          </SocialIcon>
        </Column>
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
    <Link href={props.href} rel='noreferrer'>
      {props.children}
    </Link>
  );
}
