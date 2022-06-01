
import React from 'react';
import {
  MjmlText,
  MjmlImage
} from 'mjml-react';
import { } from 'theme/colors';

const logoImagePath = '/images/charmverse_logo_sm_black.png';

export default function Header () {
  return (
    <MjmlImage
      align='left'
      href='https://app.charmverse.io'
      src={`https://app.charmverse.io/${logoImagePath}`}
      width='243px'
      height='46px'
      padding-bottom='20px'
      padding-left='20px'
      padding-top='20px'
    />
  );
}
