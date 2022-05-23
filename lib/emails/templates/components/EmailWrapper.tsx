import React from 'react';
import {
  Mjml,
  MjmlHead,
  MjmlTitle,
  MjmlPreview,
  MjmlBody,
  MjmlFont,
  MjmlStyle,
  MjmlAttributes,
  MjmlButton
} from 'mjml-react';

import styles from '../theme/styles';

interface Props {
  children: React.ReactNode;
  preview?: string;
  title: string;
}

export default function EmailWrapper (props: Props) {
  return (
    <Mjml>
      <MjmlHead>
        <MjmlTitle>{props.title}</MjmlTitle>
        {props.preview && <MjmlPreview>{props.preview}</MjmlPreview>}
        <MjmlStyle inline>
          {styles}
        </MjmlStyle>
        <MjmlAttributes>
          <MjmlButton cssClass='button' />
        </MjmlAttributes>
        <MjmlFont
          name='Roboto'
          href='https://fonts.googleapis.com/css?family=Roboto'
        />
      </MjmlHead>
      <MjmlBody width={500} backgroundColor='#fff'>
        {props.children}
      </MjmlBody>
    </Mjml>
  );
}
