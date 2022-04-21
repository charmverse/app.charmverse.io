import styled from '@emotion/styled';
import {
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from 'lib/browser';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const BASE_PADDING = 10;

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

const StyledInlinePaletteRow = styled.div<{ active: boolean, disabled: boolean }>`
  padding: 0.5rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  width: 100%;
  ${props => props.active && 'background-color: rgb(0, 0, 0, 0.125);'};
  font-weight: bold;
  font-size: 14px;
  padding: 5px ${BASE_PADDING}px
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
      active={Boolean(isActive)}
      disabled={Boolean(disabled)}
      className={className}
      style={style}
    >
      {icon}
      {title}
    </StyledInlinePaletteRow>
  );
}
