import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  cx,
  isTouchDevice,
  safeScrollIntoViewIfNeeded
} from '../../utils/utility';

const PADDING_OFFSET = 16;
const BASE_PADDING = 10;

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
}: {
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
}) {
  const ref = useRef<HTMLInputElement>(null);

  const [isHovered, setHover] = useState(false);

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
    <>
      <div
        data-id={dataId}
        onClick={onClick}
        onMouseEnter={mouseEnter}
        onMouseLeave={mouseLeave}
        ref={ref}
        className={cx(
          'flex flex-row items-center inline-palette-row',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          className,
          allowHover && 'hover-allowed',
          disabled && 'disabled',
          isActive && 'active',
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
        <span className="flex flex-col inline-palette-item">
          <span
            className={cx('text-base font-bold truncate select-none inline-palette-item-title')}
            style={{
              color: disabled ? 'var(--textColor-1)' : 'inherit',
            }}
          >
            {title}
          </span>
        </span>
      </div>
    </>
  );
}