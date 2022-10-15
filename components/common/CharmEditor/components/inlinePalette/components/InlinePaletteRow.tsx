import styled from '@emotion/styled';
import { Box } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from 'lib/utilities/browser';

interface InlinePaletteRowProps {
  dataId: string;
  title?: string;
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
  padding: 0.5rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  font-weight: bold;
  font-size: 14px;
`;

export default function InlinePaletteRow ({
  dataId,
  title,
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
      <Box display='flex' sx={{ color: 'secondary.light' }} component='span'>{icon}</Box>
      {title}
    </StyledInlinePaletteRow>
  );
}
