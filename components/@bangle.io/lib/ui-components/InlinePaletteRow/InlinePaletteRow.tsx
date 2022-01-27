import styled from '@emotion/styled';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  cx,
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from '../../utils/utility';

const PADDING_OFFSET = 16;
const BASE_PADDING = 10;

interface InlinePaletteRowProps {
  dataId: string;
  title?: string;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  icon?: JSX.Element | null;
  basePadding?: number;
  depth?: number;
  description?: string;
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
  ${props => props.active && `background-color: rgb(0, 0, 0, 0.125)`};
  font-weight: 500;
  ${props => props.disabled ? `pointer: none` : `pointer: cursor`}
`;

export function InlinePaletteRow({
  dataId,
  title,
  isActive,
  onClick,
  icon = null,
  basePadding = BASE_PADDING,
  depth = 1,
  description = '',
  className = '',
  scrollIntoViewIfNeeded = true,
  style = {},
  disabled,
  // on touch devices having :hover forces you to click twice
  allowHover = !isTouchDevice(),
}: InlinePaletteRowProps) {
  const ref = useRef<HTMLInputElement>(null);

  const [, setHover] = useState(false);

  useEffect(() => {
    if (scrollIntoViewIfNeeded && isActive) {
      ref.current && safeScrollIntoViewIfNeeded(ref.current, false);
    }
  }, [scrollIntoViewIfNeeded, isActive]);
  const mouseEnter = useCallback(() => {
    allowHover && setHover(true);
  }, [allowHover]);

  const mouseLeave = useCallback(() => {
    allowHover && setHover(false);
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
      className={cx(
        'inline-palette-row',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
        allowHover && 'hover-allowed',
      )}
      style={{
        paddingLeft: depth * basePadding,
        paddingRight: PADDING_OFFSET,
        paddingTop: 5,
        paddingBottom: 5,
        ...style,
      }}
    >
      {icon}
      <span className="inline-palette-item">
        <span
          className={cx('inline-palette-item-title')}
          style={{
            color: disabled ? 'var(--textColor-1)' : 'inherit',
          }}
        >
          {title}
        </span>
      </span>
    </StyledInlinePaletteRow>
  );
}