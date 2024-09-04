'use client';

import styled from '@emotion/styled';
import { Box, Paper, Typography } from '@mui/material';
import Image from 'next/image';

const logoSrc = '/images/coming_soon/scoutgame_logo.svg';
const logoShineSrc = '/images/coming_soon/logo_shine.png';

const Background = styled.div`
  min-height: 100vh;
  background: #111;
  display: flex;
  padding: 2em;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const BackgroundGradient = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgb(160, 108, 213);
  background: linear-gradient(
    70deg,
    rgba(160, 108, 213, 0.5) 0%,
    rgba(105, 221, 255, 0.5) 15%,
    rgba(0, 0, 0, 1) 30%,
    rgba(17, 17, 17, 0.7) 59%,
    rgba(105, 221, 255, 0.5) 85%,
    rgba(160, 108, 213, 0.5) 100%
  );
`;

export function ComingSoon() {
  return (
    <Background>
      <BackgroundGradient />
      <Box position='relative' maxWidth='100%' width={455}>
        <Image style={{ maxWidth: '100%' }} height={256} width={455} alt='' src={logoShineSrc} />
        <Image
          style={{ position: 'absolute', left: 0, top: 60, width: '100%', zIndex: 1 }}
          height={133}
          width={455}
          alt=''
          src={logoSrc}
        />
      </Box>
      <Typography align='center' sx={{ zIndex: 1 }} variant='h2'>
        COMING SOON!
      </Typography>
    </Background>
  );
}
