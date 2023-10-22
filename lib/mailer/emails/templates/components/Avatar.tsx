import { Container } from '@react-email/container';
import { Img } from '@react-email/img';
import { Section } from '@react-email/section';
import { ReactNode } from 'react';

import { stringToColor } from 'lib/utilities/strings';

import Text from './Text';

export default function Avatar({ name, avatar }: { name?: string; avatar: string | null | undefined }) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses

  return avatar ? (
    <Img
      style={{
        margin: 0,
        backgroundColor: 'initial',
        borderRadius: '50%',
        width: '32px',
        height: '32px'
      }}
      src={avatar}
    />
  ) : (
    <Text
      style={{
        color: 'white',
        margin: 0,
        backgroundColor: stringToColor(nameStr),
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        fontSize: '1.25rem',
        textAlign: 'center'
      }}
    >
      {nameStr.charAt(0).toUpperCase()}
    </Text>
  );
}
