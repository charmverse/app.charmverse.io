import React from 'react';
import {
  MjmlText,
  MjmlImage
} from 'mjml-react';

export default function Footer () {
  return (
    <>
      <MjmlImage
        align='left'
        href='https://charmverse.io'
        src='https://gate.charmverse.io/images/logo_black_transparent.64.png'
        width='32px'
        height='32px'
        padding-bottom='0px'
        padding-left='20px'
      />
      <MjmlText color='#888' fontSize={12}>

        <a href='https://charmverse.io' style={{ textDecoration: 'underline', color: 'inherit' }}>Charmverse.io</a>, Web 3 Access Control for Web 2 Tools

      </MjmlText>
    </>
  );
}
