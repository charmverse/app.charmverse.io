import type { BoxProps } from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import React from 'react';

import { LoadingCard } from './LoadingCard';

type CSSValue = number | string;

interface LoadingProps {
  component?: JSX.Element;
  height?: CSSValue;
  label?: string;
  minHeight?: CSSValue;
  isLoading?: boolean;
  size?: number;
  children?: React.ReactNode;
  className?: string;
  'data-test'?: string;
}

export function LoadingComponent({
  height,
  isLoading = true,
  component,
  label,
  children,
  minHeight,
  size = 40,
  className,
  'data-test': dataTest,
  ...restProps
}: LoadingProps & BoxProps): JSX.Element {
  if (!isLoading) {
    return (
      component || (
        <Typography variant='caption' data-test={dataTest}>
          {children}
        </Typography>
      )
    );
  }

  return (
    <LoadingCard height={height} minHeight={minHeight} className={className} gap={1} {...restProps}>
      <CircularProgress sx={{ color: '#ccc' }} size={size} />
      {label ? (
        <Typography variant='caption' style={{ color: '#aaa', paddingLeft: 8 }}>
          {label}
        </Typography>
      ) : null}
    </LoadingCard>
  );
}
