'use client';

import { Stack } from '@mui/material';
import type { StackProps } from '@mui/material';
import type { MotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

export function BoxMotion({ children, ...restProps }: StackProps & MotionProps) {
  return (
    <Stack component={motion.div} whileTap={{ scale: 0.9 }} {...restProps}>
      {children}
    </Stack>
  );
}
