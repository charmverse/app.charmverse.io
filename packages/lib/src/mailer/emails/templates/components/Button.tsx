import { charmBlue as blueColor } from '@packages/config/colors';
import type { LinkProps } from '@react-email/link';
import type { ReactNode } from 'react';
import * as React from 'react';

import Link from './Link';
import Text from './Text';

export function Button({
  children,
  href,
  variant = 'filled',
  style,
  primaryColor,
  ...props
}: {
  primaryColor?: string;
  variant?: 'filled' | 'outlined';
  children: ReactNode;
  href: string;
} & LinkProps) {
  return (
    <Link
      {...props}
      style={{
        width: '100%'
      }}
      href={href}
    >
      <Text
        bold
        style={
          variant === 'outlined'
            ? {
                textAlign: 'center',
                borderRadius: '30px',
                border: '1px solid #ccc',
                padding: '8px 24px',
                color: primaryColor || blueColor,
                ...style
              }
            : {
                textAlign: 'center',
                color: '#fff',
                padding: '8px 24px',
                borderRadius: '3px',
                background: primaryColor || blueColor,
                ...style
              }
        }
      >
        {children}
      </Text>
    </Link>
  );
}
