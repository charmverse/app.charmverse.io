'use client';

import Stack from '@mui/material/Stack';
import type { StackProps } from '@mui/material/Stack';
import { motion } from 'framer-motion';

export function FadeIn({ children, ...restProps }: StackProps) {
  return (
    <Stack component={motion.div} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} {...restProps}>
      {children}
    </Stack>
  );
}
