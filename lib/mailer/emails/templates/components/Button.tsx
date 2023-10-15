import type { LinkProps } from '@react-email/link';
import type { ReactNode } from 'react';

import { blueColor } from 'theme/colors';

import Link from './Link';
import Text from './Text';

export function Button({
  children,
  href,
  variant = 'filled',
  ...props
}: { variant?: 'filled' | 'outlined'; children: ReactNode; href: string } & LinkProps) {
  return (
    <Link {...props} href={href}>
      <Text
        primary={variant === 'outlined'}
        bold
        style={
          variant === 'outlined'
            ? {
                width: 'fit-content',
                borderRadius: '30px',
                border: '1px solid #ccc',
                padding: '10px 30px'
              }
            : {
                width: 'fit-content',
                color: '#fff',
                padding: '10px 30px !important',
                borderRadius: '3px !important',
                background: `${blueColor} !important`
              }
        }
      >
        {children}
      </Text>
    </Link>
  );
}
