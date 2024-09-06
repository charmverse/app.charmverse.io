'use client';

import styled from '@emotion/styled';
import { Box, Paper, Typography } from '@mui/material';
import Image from 'next/image';

const logoSrc = '/images/coming_soon/scoutgame_logo.svg';
const logoShineSrc = '/images/coming_soon/logo_shine.png';
const charmverseLogoSrc = '/images/coming_soon/charmverse_logo.webp';
const sunnyLogoSrc = '/images/coming_soon/sunnyawards_logo.png';

const Background = styled.div`
  min-height: 100vh;
  background: #000;
  display: flex;
  padding: 2em;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .center-content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
  }
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
    rgba(17, 17, 17, 0.7) 70%,
    rgba(105, 221, 255, 0.5) 85%,
    rgba(160, 108, 213, 0.5) 100%
  );
`;

export function ComingSoon() {
  return (
    <Background>
      <BackgroundGradient />
      <div className='center-content'>
        <Box position='relative' maxWidth='100%' width={455}>
          <Image style={{ height: 'auto', maxWidth: '100%' }} height={256} width={455} alt='' src={logoShineSrc} />
          <Box position='absolute' left={0} top={0} bottom={0} right={0} display='flex' alignItems='center'>
            <Image style={{ width: '100%' }} height={133} width={455} alt='' src={logoSrc} />
          </Box>
        </Box>
        <Typography align='center' sx={{ zIndex: 1 }} variant='h3'>
          COMING SOON!
        </Typography>
      </div>

      <Box zIndex={1}>
        <Typography align='center'>
          Brought to you by the team behind
          <br />
          The SUNNYs and CharmVerse
        </Typography>
        <Box display='flex' alignItems='center' justifyContent='space-between' mt={2}>
          <a href='https://www.thesunnyawards.fun/' target='_blank' rel='noreferrer'>
            <Image alt='' src={sunnyLogoSrc} width={1000} height={629} style={{ height: 40, width: 'auto' }} />
          </a>
          <a href='https://charmverse.io/' target='_blank' rel='noreferrer'>
            <Image alt='' src={charmverseLogoSrc} width={115} height={20} />
          </a>
        </Box>
      </Box>
    </Background>
  );
}
