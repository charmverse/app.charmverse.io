import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import { Section } from '@react-email/section';
import React from 'react';

import Button from '../components/Button';
import Text from '../components/Text';

const lightGreyColor = '#edf2f4';

export function ClaimPointsTemplate({ points, displayName }: { points: number; displayName: string }) {
  return (
    <Html>
      <Head>
        <title>Congratulations you just earned points in the Scout Game</title>
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
            <Text>
              Congratulations, {displayName} you just earned {points} points this week in the Scout Game.
            </Text>
            <Button href='https://scoutgame.xyz/profile?tab=win'>Claim</Button>
          </Section>
        </Section>
      </Section>
    </Html>
  );
}
