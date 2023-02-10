import type { SxProps, Theme } from '@mui/material';
import { Box } from '@mui/material';

export default function TokenLogo({
  src,
  height = 25,
  sx
}: {
  src: string;
  height?: number | string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box display='flex' justifyContent='center' sx={sx}>
      <img style={{ height, width: 'auto' }} src={src} />
    </Box>
  );
}
