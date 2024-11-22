import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Section } from '@react-email/section';
import React from 'react';

import Button from '../components/Button';
import Text from '../components/Text';

const lightGreyColor = '#edf2f4';

export function ClosedPullRequestTemplate({
  pullRequestLink,
  currentStrikesCount
}: {
  pullRequestLink: string;
  currentStrikesCount: number;
}) {
  const isBanned = currentStrikesCount >= 3;

  return (
    <Html>
      <Head>
        <title>Scout Game Alert: ⚠️</title>
      </Head>
      <Section
        style={{
          backgroundColor: lightGreyColor
        }}
      >
        <Section
          style={{
            width: 600,
            backgroundColor: '#fff'
          }}
        >
          <Img
            src='https://scoutgame.xyz/images/info/info_banner.png'
            style={{
              maxHeight: '150px',
              width: '100%',
              objectFit: 'cover'
            }}
          />
          <Section
            style={{
              padding: 30
            }}
          >
            {!isBanned ? (
              <>
                <Text>
                  It looks like{' '}
                  <a href={pullRequestLink} style={{ color: '#A06CD5', textDecoration: 'none' }}>
                    this Pull Request
                  </a>{' '}
                  was closed by the maintainer. As a result, you've received your first strike in the Scout Game. Your
                  current strike count is {currentStrikesCount}.
                </Text>
                <Text>
                  Please note that if you reach 3 strikes, your account will be suspended from the Scout Game.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  It looks like{' '}
                  <a href={pullRequestLink} style={{ color: '#A06CD5', textDecoration: 'none' }}>
                    this Pull Request
                  </a>{' '}
                  was closed by the maintainer. As a result, you've received your third strike in the Scout Game.
                </Text>
                <Text>
                  Your current strike count is 3, and your account has been suspended from further participation in the
                  Scout Game.
                </Text>
              </>
            )}
            <Text>
              If you believe this was a mistake and wish to appeal now or after 3 strikes, you can submit an appeal at:
            </Text>
            <Button href='https://appeal.scoutgame.xyz'>Appeal</Button>
          </Section>
        </Section>
      </Section>
    </Html>
  );
}
