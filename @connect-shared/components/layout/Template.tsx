'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const mobileVariants = {
  hidden: { opacity: 0, x: 200, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 200, y: 0 }
};

const desktopVariants = {
  hidden: { opacity: 0 },
  enter: { opacity: 1 },
  exit: { opacity: 0 }
};

export function Template({ children }: { children: ReactNode }) {
  const key = usePathname();
  const theme = useTheme();
  const matchesDesktop = useMediaQuery(theme.breakpoints.up('md'));

  if (!matchesDesktop) {
    return (
      <AnimatePresence mode='wait'>
        <motion.div
          style={{ height: '100%' }}
          key={key}
          initial='hidden'
          animate='enter'
          exit='exit'
          variants={mobileVariants}
          transition={{ type: 'easeInOut', duration: 0.2 }}
          className='overflow-hidden'
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={key}
        initial='hidden'
        animate='enter'
        exit='exit'
        variants={desktopVariants}
        transition={{ type: 'easeInOut', duration: 0.2 }}
        className='overflow-hidden'
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
