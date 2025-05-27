import { styled } from '@mui/material';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import Popper from '@mui/material/Popper';
import React, { useEffect, useRef, useState } from 'react';

type SubMenuOptionProps = {
  id: string;
  name: string;
  position?: 'bottom' | 'top' | 'left' | 'left-bottom';
  icon?: React.ReactNode;
  children: React.ReactNode;
};

const StyledPopper = styled(Popper)`
  z-index: var(--z-index-modal);
`;

function SubMenuOption(props: SubMenuOptionProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const node = useRef<HTMLDivElement>(null);

  const openLeftClass = props.position === 'left' || props.position === 'left-bottom' ? ' open-left' : '';

  const popperRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const box = popperRef?.current?.getBoundingClientRect();
      const padding = 10;
      if (box) {
        if (box.top + box.bottom + padding > windowHeight) {
          setMaxHeight(windowHeight - box.top - padding);
        } else {
          setMaxHeight(0);
        }
      }
    };
    window.addEventListener('resize', handleResize);

    // run once on load, wait for menu to render
    setTimeout(() => {
      handleResize();
    }, 0);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      id={props.id}
      ref={node}
      className={`MenuOption SubMenuOption menu-option${openLeftClass}`}
      onMouseEnter={() => {
        setTimeout(() => {
          setIsOpen(true);
        }, 50);
      }}
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      {(props.position === 'left' || props.position === 'left-bottom') && (
        <ArrowDropDownOutlinedIcon fontSize='small' />
      )}
      {props.icon ?? <div className='noicon' />}
      <div className='menu-name'>{props.name}</div>
      {props.position !== 'left' && props.position !== 'left-bottom' && <ArrowDropDownOutlinedIcon fontSize='small' />}
      <StyledPopper anchorEl={node.current} open={isOpen} placement='right-start'>
        <div ref={popperRef} style={{ maxHeight: maxHeight || 'none' }} className='SubMenu Menu noselect '>
          <div className='menu-contents'>
            <div className='menu-options'>{props.children}</div>
          </div>
        </div>
      </StyledPopper>
    </div>
  );
}

export default React.memo(SubMenuOption);
