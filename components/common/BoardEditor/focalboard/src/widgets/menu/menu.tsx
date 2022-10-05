import styled from '@emotion/styled';
import Popper from '@mui/material/Popper';
import { useEffect, useRef, useState } from 'react';

import ColorOption from './colorOption';
import LabelOption from './labelOption';
import { useMenuContext } from './menuContext';
import SeparatorOption from './separatorOption';
import SubMenuOption from './subMenuOption';
import SwitchOption from './switchOption';
import TextOption from './textOption';

type Props = {
    children: React.ReactNode;
    position?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top' | 'bottom' | 'left' | 'right';
}

const StyledPopper = styled(Popper)`
    z-index: var(--z-index-modal);
`;

function Menu (props: Props) {

  const { position, children } = props;
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
        }
        else {
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
    <StyledPopper anchorEl={anchorEl} open={true} disablePortal placement={position || 'bottom-start'}>
      <div
        ref={popperRef}
        style={{ maxHeight: maxHeight || 'none' }}
        className={`Menu noselect ${position || 'bottom-start'}`}
      >
        <div className='menu-contents'>
          <div className='menu-options'>
            {children}
          </div>

          <div className='menu-spacer hideOnWidescreen' />

          <div className='menu-options hideOnWidescreen'>
            <Menu.Text
              id='menu-cancel'
              name='Cancel'
              className='menu-cancel'
              onClick={() => undefined}
            />
          </div>
        </div>
      </div>
    </StyledPopper>
  );
}

Menu.Color = ColorOption;
Menu.SubMenu = SubMenuOption;
Menu.Switch = SwitchOption;
Menu.Separator = SeparatorOption;
Menu.Text = TextOption;
Menu.Label = LabelOption;

export default Menu;
