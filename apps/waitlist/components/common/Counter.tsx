'use client';

import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import { animate, useInView, useIsomorphicLayoutEffect } from 'framer-motion';
import type { KeyframeOptions } from 'framer-motion';
import { useRef } from 'react';

type Props = {
  from?: number;
  to?: number;
  animationOptions?: KeyframeOptions;
};

export function Counter({ from = 0, to = 0, animationOptions = {} }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;
    if (!inView) return;

    // Set initial value
    element.textContent = String(from);

    // If reduced motion is enabled in system's preferences
    if (window.matchMedia('(prefers-reduced-motion)').matches) {
      element.textContent = String(to);
      return;
    }

    const controls = animate(from, to, {
      duration: 2,
      ease: 'easeOut',
      ...animationOptions,
      onUpdate(value) {
        element.textContent = value.toFixed(0);
      }
    });
    return () => controls.stop();
  }, [ref, inView, from, to, animationOptions]);

  return (
    <Box component='span' ref={ref}>
      {from}
    </Box>
  );
}
