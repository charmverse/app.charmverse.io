import { styled } from '@mui/material';
import Popper from '@mui/material/Popper';
import { useEffect, useRef, useState } from 'react';

import CheckboxOption from './checkboxOption';
import ColorOption from './colorOption';
import LabelOption from './labelOption';
import { useMenuContext } from './menuContext';
import SeparatorOption from './separatorOption';
import SubMenuOption from './subMenuOption';
import TextOption from './textOption';

type Props = {
  children: React.ReactNode;
  position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top' | 'bottom' | 'left' | 'right';
  disablePortal?: boolean;
};

const StyledPopper = styled(Popper)`
  z-index: var(--z-index-modal);
`;

function Menu({ position = 'bottom-start', children, disablePortal = true }: Props) {
  const [anchorEl] = useMenuContext();
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
    <StyledPopper anchorEl={anchorEl} open={true} disablePortal={disablePortal} placement={position}>
      <div
        ref={popperRef}
        style={{ maxHeight: maxHeight || undefined }}
        className={`Menu noselect ${position || 'bottom-start'}`}
      >
        <div className='menu-contents'>
          <div className='menu-options'>{children}</div>
        </div>
      </div>
    </StyledPopper>
  );
}

Menu.Color = ColorOption;
Menu.SubMenu = SubMenuOption;
Menu.Separator = SeparatorOption;
Menu.Text = TextOption;
Menu.Label = LabelOption;

export default Menu;
