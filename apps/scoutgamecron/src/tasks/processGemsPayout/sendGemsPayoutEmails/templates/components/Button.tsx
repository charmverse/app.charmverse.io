import type { LinkProps } from '@react-email/link';
import type { ReactNode } from 'react';
import React from 'react';

import Link from './Link';
import Text from './Text';

export default function Button({
  children,
  href,
  style,
  ...props
}: {
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
        style={{
          textAlign: 'center',
          color: '#fff',
          padding: '8px 24px',
          borderRadius: '3px',
          background: '#A06CD5',
          ...style
        }}
      >
        {children}
      </Text>
    </Link>
  );
}
