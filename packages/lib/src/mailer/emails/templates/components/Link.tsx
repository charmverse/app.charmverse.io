import { charmBlue as blueColor } from '@packages/config/colors';
import type { LinkProps } from '@react-email/link';
import { Link as ReactEmailLink } from '@react-email/link';
import type { ReactNode } from 'react';
import * as React from 'react';

export default function Link({
  primaryColor = blueColor,
  children,
  ...props
}: {
  primaryColor?: string;
  children: ReactNode;
} & LinkProps) {
  return (
    <ReactEmailLink
      {...props}
      target='_blank'
      rel='noreferrer'
      style={{
        color: primaryColor,
        textDecoration: 'none',
        ...(props.style ?? {})
      }}
    >
      {children}
    </ReactEmailLink>
  );
}
