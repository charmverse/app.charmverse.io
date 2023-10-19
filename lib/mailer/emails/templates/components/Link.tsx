import type { LinkProps } from '@react-email/link';
import { Link as ReactEmailLink } from '@react-email/link';
import type { ReactNode } from 'react';

import { blueColor } from 'theme/colors';

export default function Link({ children, ...props }: { children: ReactNode } & LinkProps) {
  return (
    <ReactEmailLink
      {...props}
      target='_blank'
      rel='noreferrer'
      style={{
        color: blueColor,
        textDecoration: 'none',
        ...(props.style ?? {})
      }}
    >
      {children}
    </ReactEmailLink>
  );
}
