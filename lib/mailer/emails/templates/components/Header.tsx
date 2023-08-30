import { MjmlText, MjmlImage } from 'mjml-react';
import React from 'react';
import {} from 'theme/colors';

const domain = process.env.DOMAIN;
const logoImagePath = '/images/charmverse_logo_sm_black.png';

const dimensions = {
  medium: {
    height: '46px',
    width: '243px'
  },
  small: {
    height: '36px',
    width: '190px'
  }
};

export default function Header({ size = 'medium' }: { size?: 'small' | 'medium' }) {
  return (
    <MjmlImage
      align='left'
      href={domain}
      src={`${domain}${logoImagePath}`}
      width={dimensions[size].width}
      height={dimensions[size].height}
      padding-bottom='20px'
      padding-left='20px'
      padding-top='20px'
    />
  );
}
