import { memo } from 'react';
import type { SxProps } from '@mui/system';
import { alpha } from '@mui/system';
import { Box } from '@mui/material';
import { useTheme } from '@emotion/react';

function PlaceHolder ({ show, text = "Type '/' for commands", sx }: { sx?: SxProps; text?: string; show: boolean; }) {
  const theme = useTheme();
  return show ? (
    <Box sx={{
      top: '-2em',
      pointerEvents: 'none',
      position: 'relative',
      color: alpha(theme.palette.text.secondary, 0.5),
      zIndex: -20,
      ...(sx ?? {})
    }}
    >
      {text}
    </Box>
  ) : null;
}

export default memo(PlaceHolder);
