import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';

type CSSValue = number | string;

export function LoadingCard({
  minHeight,
  height,
  children,
  ...restProps
}: {
  minHeight?: CSSValue;
  height?: CSSValue;
} & BoxProps) {
  return (
    <Box
      alignItems='center'
      display='flex'
      justifyContent='center'
      height='100%'
      minHeight={height || minHeight ? `${minHeight}px` : 'inherit'}
      {...restProps}
    >
      {children}
    </Box>
  );
}
