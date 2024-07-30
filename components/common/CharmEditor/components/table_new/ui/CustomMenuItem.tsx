// @flow

import './czi-custom-menu-item.css';
import React from 'react';

import CustomButton from './CustomButton';

class CustomMenuItemSeparator extends React.PureComponent<any, any, any> {
  render() {
    return <div className='czi-custom-menu-item-separator' />;
  }
}

class CustomMenuItem extends React.PureComponent<{
  label: string;
  active?: boolean;
  disabled?: boolean | null;
  onClick: ((value: any, e: React.SyntheticEvent) => void) | null;
  onMouseEnter: ((value: any, e: React.SyntheticEvent) => void) | null;
  value: any;
}> {
  static Separator = CustomMenuItemSeparator;

  render() {
    return <CustomButton {...this.props} className='czi-custom-menu-item' />;
  }
}

export default CustomMenuItem;
