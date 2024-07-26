'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const variants = {
  hidden: { opacity: 0, x: 200, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: 0 }
};

export default function Template({ children }: { children: ReactNode }) {
  const key = usePathname();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));

  if (matches) {
    return (
      <AnimatePresence mode='wait'>
        <motion.div
          key={key}
          initial='hidden'
          animate='enter'
          exit='exit'
          variants={variants}
          transition={{ type: 'linear', duration: 0.2 }}
          className='overflow-hidden'
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return children;
}
