import type { LinkProps } from '@react-email/link';
import type { ReactNode } from 'react';

import { blueColor } from 'theme/colors';

import Link from './Link';
import Text from './Text';

export function Button({
  children,
  href,
  variant = 'filled',
  style,
  ...props
}: { variant?: 'filled' | 'outlined'; children: ReactNode; href: string } & LinkProps) {
  return (
    <Link {...props} href={href}>
      <Text
        bold
        style={
          variant === 'outlined'
            ? {
                textAlign: 'center',
                width: 'fit-content',
                borderRadius: '30px',
                border: '1px solid #ccc',
                padding: '8px 24px',
                color: blueColor,
                ...style
              }
            : {
                textAlign: 'center',
                width: 'fit-content',
                color: '#fff',
                padding: '8px 24px',
                borderRadius: '3px',
                background: blueColor,
                ...style
              }
        }
      >
        {children}
      </Text>
    </Link>
  );
}
