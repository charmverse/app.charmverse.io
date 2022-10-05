import {
  Mjml,
  MjmlHead,
  MjmlText,
  MjmlTitle,
  MjmlPreview,
  MjmlBody,
  MjmlDivider,
  MjmlStyle,
  MjmlAttributes,
  MjmlButton
} from 'mjml-react';
import React from 'react';

import { fontFamily } from 'theme';
import { lightGreyColor, primaryTextColor } from 'theme/colors';

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

        {/* inject inline CSS */}
        <MjmlStyle inline>{styles}</MjmlStyle>

        {/* MjmlAttributes applies default attributes to MJML components */}
        <MjmlAttributes>
          <MjmlButton cssClass='button' />
          <MjmlDivider cssClass='mjml-divider' />
          <MjmlText font-family={fontFamily} color={primaryTextColor} font-size='18px' line-height='26px' />
        </MjmlAttributes>

      </MjmlHead>
      <MjmlBody width={600} backgroundColor={lightGreyColor} css-class='mjml-root'>
        {props.children}
      </MjmlBody>
    </Mjml>
  );
}
