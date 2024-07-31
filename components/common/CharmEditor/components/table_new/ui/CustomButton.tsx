// import cx from 'classnames';
import React from 'react';

import PointerSurface from './PointerSurface';
import type { PointerSurfaceProps } from './PointerSurface';

class CustomButton extends React.PureComponent<
  PointerSurfaceProps & {
    icon?: string | React.ReactNode | null;
    label?: string | React.ReactNode | null;
  }
> {
  render() {
    const { icon, label, className, title, ...pointerProps } = this.props;
    // const klass = cx(className, 'czi-custom-button', {
    //   'use-icon': !!icon
    // });
    return (
      // <TooltipSurface tooltip={title}>
      <PointerSurface {...pointerProps} className='czi-custom-button'>
        {icon}
        {label}
      </PointerSurface>
      // </TooltipSurface>
    );
  }
}

export default CustomButton;
