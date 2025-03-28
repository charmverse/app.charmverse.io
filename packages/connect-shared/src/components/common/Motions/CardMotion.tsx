'use client';

import type { CardProps } from '@mui/material/Card';
import Card from '@mui/material/Card';
import { motion } from 'framer-motion';

export function CardMotion({ children, ...restProps }: CardProps) {
  return (
    <Card component={motion.div} whileTap={{ scale: 0.98 }} {...restProps}>
      {children}
    </Card>
  );
}
