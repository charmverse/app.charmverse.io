'use client';

import { Box, Typography } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

import { tierDistribution } from 'lib/scoring/constants';

interface ProgressBarProps {
  from: number;
  to: number;
}

export default function ProgressBar({ from, to }: ProgressBarProps) {
  const controls = useAnimation();

  React.useEffect(() => {
    controls.start({ width: `${to - from}%` });
  }, [from, to, controls]);

  return (
    <Box width='100%' position='relative' paddingTop='30px' paddingBottom='24px'>
      <Box
        bgcolor='transparent'
        height='30px'
        borderRadius='15px'
        borderColor='white'
        sx={{ borderWidth: '2px', borderStyle: 'solid' }}
      >
        <Box
          overflow='hidden'
          height='100%'
          bgcolor='secondary.main'
          component={motion.div}
          initial={{ width: `${from}%` }}
          animate={controls}
          transition={{ duration: 1, ease: 'easeInOut' }}
          sx={{
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '0',
            borderBottomRightRadius: '0',
            borderBottomLeftRadius: '15px'
          }}
        />
      </Box>
      {tierDistribution
        .filter((item) => item.tier !== 'common')
        .map((milestone, index) => (
          <Box
            component={motion.div}
            key={milestone.tier}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2 + 1, type: 'spring', stiffness: 200, damping: 10 }}
            display='flex'
            flexDirection='column'
            alignItems='center'
            position='absolute'
            bottom='0'
            left={`${milestone.threshold - 5}%`}
          >
            <Image src={milestone.badge} width={30} height={30} alt={milestone.tier} style={{ width: 'auto' }} />
            <Box width='4px' height='15px' bgcolor={milestone.threshold >= to ? 'white' : 'black'} />
            <Typography variant='body2' component='span' fontWeight='700'>
              {milestone.threshold}%
            </Typography>
          </Box>
        ))}
    </Box>
  );
}
