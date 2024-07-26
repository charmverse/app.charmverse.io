import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function BlockchainLogo({
  src,
  height = 18,
  sx
}: {
  src: string;
  height?: number | string;
  sx?: SxProps<Theme>;
}) {
  // Extract the final part of the URL
  const filename = src.split('/').pop();
  // Replace the path with the new API path
  const apiPath = `/api/images/crypto-logos?logo=${encodeURIComponent(filename ?? '')}`;

  return (
    <Box
      display='flex'
      justifyContent='center'
      // add a background color to emphasize icons like Eth
      sx={{ background: 'var(--icon-bg)', p: '4px', ml: '-4px', borderRadius: '50%', ...sx }}
    >
      <Image style={{ height, width: 'auto' }} height={18} width={18} alt='chain logo' src={apiPath} />
    </Box>
  );
}
