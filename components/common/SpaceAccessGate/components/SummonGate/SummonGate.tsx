import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import game7LogoImage from 'public/images/game7_logo.png';

import { GateOption } from '../GateOption';

import type { SummonGateState } from './hooks/useSummonGate';

export function SummonGate({ isVerifying, verifyResult }: SummonGateState) {
  const isVerified = verifyResult?.isVerified ?? null;

  return (
    <GateOption isVerifying={isVerifying} isVerified={isVerified}>
      <Box display='flex' gap={2} alignItems='center'>
        <Image width={20} alt='Game 7' src={game7LogoImage} />
        <Typography>Belong to a Summon community</Typography>
      </Box>
    </GateOption>
  );
}
