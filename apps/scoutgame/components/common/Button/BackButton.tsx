'use client';

import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import type { IconButtonProps } from '@mui/material';
import { IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';

import { BoxMotion } from '../Motions/BoxMotion';

export function BackButton(props: IconButtonProps) {
  const router = useRouter();

  return (
    <IconButton onClick={router.back} {...props}>
      <BoxMotion>
        <KeyboardBackspaceIcon color='primary' />
      </BoxMotion>
    </IconButton>
  );
}
