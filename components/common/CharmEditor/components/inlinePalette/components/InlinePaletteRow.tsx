import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Box, ListItemText, Paper, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from 'lib/utilities/browser';

interface InlinePaletteRowProps {
  dataId: string;
  title?: string;
  description?: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  icon?: JSX.Element | null;
  className?: string;
  scrollIntoViewIfNeeded?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
  // on touch devices having :hover forces you to click twice
  allowHover?: boolean;
}

const StyledInlinePaletteRow = styled.div<{ disabled: boolean }>`
  padding: 0.3rem 0;
  min-height: 55px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
`;

export default function InlinePaletteRow ({
  dataId,
  title,
  description,
  isActive,
  onClick,
  icon = null,
  className = '',
  scrollIntoViewIfNeeded = true,
  style = {},
  disabled,
  // on touch devices having :hover forces you to click twice
  allowHover = !isTouchDevice()
}: InlinePaletteRowProps) {
  const ref = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const [, setHover] = useState(false);

  useEffect(() => {
    if (scrollIntoViewIfNeeded && isActive) {
      if (ref.current) {
        safeScrollIntoViewIfNeeded(ref.current, false);
      }
    }
  }, [scrollIntoViewIfNeeded, isActive]);
  const mouseEnter = useCallback(() => {
    if (allowHover) {
      setHover(true);
    }
  }, [allowHover]);

  const mouseLeave = useCallback(() => {
    if (allowHover) {
      setHover(false);
    }
  }, [allowHover]);

  return (
    <StyledInlinePaletteRow
      data-id={dataId}
      onClick={onClick}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
      ref={ref}
      disabled={Boolean(disabled)}
      className={className}
      style={style}
    >
      <Paper
        elevation={0}
        variant='outlined'
        sx={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'secondary.light', marginLeft: '10px' }}
      >
        {icon}
      </Paper>
      <Box padding='0 12px 0 6px' display='flex' flexDirection='column'>
        <Typography variant='body2' noWrap whiteSpace='normal'>{title}</Typography>
        <Typography variant='caption' noWrap whiteSpace='normal' color='secondary.light'>{description}</Typography>
      </Box>
    </StyledInlinePaletteRow>
  );
}
