import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from 'lib/utilities/browser';

import type { InlinePaletteSize } from './InlineCommandPalette';

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
  size: InlinePaletteSize;
}

const StyledPaper = styled(Paper)<{ size: InlinePaletteSize }>`
  width: ${({ size }) => (size === 'small') ? '22px' : '46px'};
  height: ${({ size }) => (size === 'small') ? '22px' : '46px'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.secondary.light};
  margin-left: 10px;
`;

const StyledInlinePaletteRow = styled.div<{ disabled: boolean, size: InlinePaletteSize }>`
  padding: 0.3rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  ${({ size }) => size === 'big' && `
      min-height: 55px;
  `}

  ${({ size }) => size === 'small' && `
    svg {
      width: 17px;
      height: 17px;
    }
  `}
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
  size,
  // on touch devices having :hover forces you to click twice
  allowHover = !isTouchDevice()
}: InlinePaletteRowProps) {
  const ref = useRef<HTMLInputElement>(null);

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
      size={size}
    >
      <StyledPaper
        elevation={0}
        variant='outlined'
        size={size}
      >
        {icon}
      </StyledPaper>
      <Box padding='0 12px 0 6px' display='flex' flexDirection='column'>
        <Typography variant='body2' noWrap whiteSpace='normal'>{title}</Typography>
        <Typography variant='caption' noWrap whiteSpace='normal' color='secondary.light'>{description}</Typography>
      </Box>
    </StyledInlinePaletteRow>
  );
}
