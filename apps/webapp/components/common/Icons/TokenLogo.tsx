import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';

export function TokenLogo({ src, height = 18, sx }: { src: string; height?: number | string; sx?: SxProps<Theme> }) {
  return (
    <span>
      <Box
        display='flex'
        justifyContent='center'
        // add a background color to emphasize icons like Eth
        sx={{ background: 'var(--icon-bg)', p: '4px', borderRadius: '50%', ...sx }}
      >
        <img style={{ height, width: 'auto' }} src={src} />
      </Box>
    </span>
  );
}
