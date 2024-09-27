'use client';

import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';
import { useRef } from 'react';

export function ScrollButton({ children, scrollType, ...restProps }: ButtonProps & { scrollType: 'up' | 'down' }) {
  const footerRef = useRef<HTMLButtonElement>(null);

  const scrollDown = () => footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Button variant='text' onClick={scrollType === 'down' ? scrollDown : scrollUp} ref={footerRef} {...restProps}>
      {children}
    </Button>
  );
}
