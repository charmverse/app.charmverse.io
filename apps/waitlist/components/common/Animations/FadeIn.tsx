'use client';

import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

export function FadeIn({ children, ...restProps }: BoxProps) {
  return (
    <Box component={motion.div} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} {...restProps}>
      {children}
    </Box>
  );
}
