import { useTheme, Box, Typography } from '@mui/material';
import Image from 'next/image';

import { GateOption } from '../GateOption';

import type { SummonGateState } from './hooks/useSummonGate';

export function SummonGate({ isVerifying, verifyResult }: SummonGateState) {
  const isVerified = verifyResult?.isVerified ?? null;

  const theme = useTheme();

  return (
    <GateOption isVerifying={isVerifying} isVerified={isVerified}>
      <Box display='flex' gap={2} alignItems='center'>
        <Image
          width={20}
          alt='Game 7'
          src={
            theme.palette.mode === 'dark' ? 'images/logos/summon_light_mark.svg' : 'images/logos/summon_dark_mark.svg'
          }
        />
        <Typography>Belong to a Summon community</Typography>
      </Box>
    </GateOption>
  );
}
