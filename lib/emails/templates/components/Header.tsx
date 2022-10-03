
import {
  MjmlText,
  MjmlImage
} from 'mjml-react';
import React from 'react';
import { } from 'theme/colors';

const domain = process.env.DOMAIN;
const logoImagePath = '/images/charmverse_logo_sm_black.png';

export default function Header () {
  return (
    <MjmlImage
      align='left'
      href={domain}
      src={`${domain}${logoImagePath}`}
      width='243px'
      height='46px'
      padding-bottom='20px'
      padding-left='20px'
      padding-top='20px'
    />
  );
}
