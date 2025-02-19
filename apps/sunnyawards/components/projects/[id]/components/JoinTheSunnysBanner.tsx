'use client';

import styled from '@emotion/styled';
import { Box, Card, CardMedia, Divider, Link, Stack, Typography } from '@mui/material';
import { useTrackEvent } from '@packages/connect-shared/hooks/useTrackEvent';
import Image from 'next/image';

const TextOverlay = styled.div`
  bottom: 0;
  align-items: center;
  color: var(--charm-palette-gold-main);
  display: flex;
  flex-direction: row;
  font-size: 24px;
  font-weight: 500;
  justify-content: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
`;

const Placeholder = styled.div`
  height: 100px;
`;

export function JoinTheSunnysBanner() {
  const trackEvent = useTrackEvent();
  return (
    <>
      <Card
        component={Link}
        href='https://www.thesunnyawards.fun/'
        target='_blank'
        onMouseDown={() => {
          trackEvent('click_join_the_sunnys');
        }}
        sx={{
          bgcolor: 'transparent',
          borderRadius: 2,
          border: '0 none',
          display: 'flex',
          flexDirection: 'row',
          textAlign: 'right',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <TextOverlay>Join The SUNNYs</TextOverlay>
        <CardMedia component='img' height='100' image='/images/sunny-banner.jpeg' />
        {/* <Image
        src='/images/sunny-banner.jpg'
        width={500}
        height={200}
        sizes='100vw'
        style={{
          maxWidth: '200px',
          height: 'auto'
        }}
        alt='Charmverse Connect homepage'
      /> */}
      </Card>
      <Placeholder />
    </>
  );
}
