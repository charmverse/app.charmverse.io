import ClickAwayListener from '@mui/material/ClickAwayListener';
import React, { memo, useRef, useMemo, useState, useEffect } from 'react';

import type { Context } from './menu/menuContext';
import { MenuContext, useMenuContext } from './menu/menuContext';

type Props = {
  children?: React.ReactNode;
  stopPropagationOnToggle?: boolean;
  className?: string;
  disabled?: boolean;
  isOpen?: boolean;
  label?: string;
};

function MenuWrapper(props: Props) {
  const node = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(Boolean(props.isOpen));
  const [, setAnchorEl] = useMenuContext();

  if (!Array.isArray(props.children) || props.children.length !== 2) {
    throw new Error('MenuWrapper needs exactly 2 children');
  }

  const toggle = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    if (props.disabled) {
      return;
    }

    /**
     * This is only here so that we can toggle the menus in the sidebar, because the default behavior of the mobile
     * version (ie the one that uses a modal) needs propagation to close the modal after selecting something
     * We need to refactor this so that the modal is explicitly closed on toggle, but for now I am aiming to preserve the existing logic
     * so as to not break other things
     * */
    if (props.stopPropagationOnToggle) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpen(!open);
  };

  useEffect(() => {
    const close = (): void => {
      setOpen(false);
    };

    const closeOnBlur = (e: Event) => {
      if (e.target && node.current?.contains(e.target as Node)) {
        return;
      }

      close();
    };

    const keyboardClose = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }

      if (e.key === 'Tab') {
        closeOnBlur(e);
      }
    };

    document.addEventListener('menuItemClicked', close, true);
    document.addEventListener('keyup', keyboardClose, true);
    return () => {
      document.removeEventListener('menuItemClicked', close, true);
      document.removeEventListener('keyup', keyboardClose, true);
    };
  }, []);

  useEffect(() => {
    setAnchorEl(node.current);
  }, [node]);

  const { children } = props;
  let className = 'MenuWrapper';
  if (props.disabled) {
    className += ' disabled';
  }
  if (props.className) {
    className += ` ${props.className}`;
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        role='button'
        data-testid='menu-wrapper'
        aria-label={props.label || 'menuwrapper'}
        className={className}
        onClick={toggle}
        ref={node}
      >
        {children ? Object.values(children)[0] : null}
        {children && !props.disabled && open ? Object.values(children)[1] : null}
      </div>
    </ClickAwayListener>
  );
}

// create an anchorRef to pass down as context to the menu popper
function MenuWithContext(props: Props) {
  const [anchorRef, setAnchorRef] = useState<HTMLDivElement | null>(null);
  const value: Context = useMemo(() => [anchorRef, setAnchorRef], [anchorRef, setAnchorRef]);
  return (
    <MenuContext.Provider value={value}>
      <MenuWrapper {...props} />
    </MenuContext.Provider>
  );
}

export default memo(MenuWithContext);
