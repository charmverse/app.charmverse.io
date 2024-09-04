'use client';

import styled from '@emotion/styled';
import { Box, Paper, Typography } from '@mui/material';

const Background = styled.div`
  min-height: 100vh;
  background: #111;
`;

const BackgroundGradient = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
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
      <BackgroundGradient>
        <Typography variant='h1'>Coming Soon!</Typography>
      </BackgroundGradient>
    </Background>
  );
}
