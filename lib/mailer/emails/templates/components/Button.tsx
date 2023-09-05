import { MjmlButton } from 'mjml-react';
import type { ComponentProps, ReactNode } from 'react';

export function Button({
  children,
  href,
  ...props
}: { children: ReactNode; href: string } & ComponentProps<typeof MjmlButton>) {
  return (
    <MjmlButton {...props} href={href} target='_blank' rel='noreferrer'>
      {children}
    </MjmlButton>
  );
}
