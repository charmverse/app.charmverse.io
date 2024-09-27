import type { DividerProps } from '@mui/material';
import { Divider } from '@mui/material';

export function DotsDivider({ sx, ...props }: DividerProps) {
  return (
    <Divider
      sx={{
        width: '100%',
        borderStyle: 'dashed solid',
        flexShrink: 1,
        color: 'white',
        alignSelf: 'center',
        borderBottomWidth: 'medium',
        borderColor: 'color-mix(in srgb, currentColor 50%, transparent)',
        ...sx
      }}
      {...props}
    />
  );
}
