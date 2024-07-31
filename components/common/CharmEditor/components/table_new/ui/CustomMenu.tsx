import React from 'react';

class CustomMenu extends React.PureComponent<{ children: React.ReactNode }> {
  render() {
    const { children } = this.props;
    return <div className='czi-custom-menu czi-custom-scrollbar'>{children}</div>;
  }
}

export default CustomMenu;
