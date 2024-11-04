'use client';

import type { Theme } from '@mui/material';
import { Stack, Tooltip, useMediaQuery } from '@mui/material';
import { useState } from 'react';

import { Dialog } from 'components/common/Dialog';

import { BuilderCardActivityTooltip } from './BuilderCardActivityTooltip';

export function BuilderCardActivity({
  size,
  last7DaysGems
}: {
  size: 'x-small' | 'small' | 'medium' | 'large';
  last7DaysGems: number[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const gemHeight = size === 'x-small' || size === 'small' ? 12.5 : size === 'medium' ? 14.5 : 16;
  return (
    <>
      <Tooltip title={<BuilderCardActivityTooltip />}>
        <Stack
          flexDirection='row'
          gap={{
            xs: 0.75,
            md: size === 'medium' || size === 'large' ? 1.25 : 0.75
          }}
          width='100%'
          height={gemHeight}
          px={1}
          mt={{
            xs: 0.1,
            md: 0.5
          }}
          alignItems='center'
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
        >
          {last7DaysGems?.map((gem, index) => {
            const height = gem === 0 ? gemHeight * 0.35 : gem <= 29 ? gemHeight * 0.65 : gemHeight;

            return (
              <Stack
                key={`${index.toString()}-${gem}`}
                sx={{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <Stack
                  sx={{
                    borderRadius: '50%',
                    width: height,
                    height,
                    backgroundColor: 'text.secondary'
                  }}
                />
              </Stack>
            );
          })}
        </Stack>
      </Tooltip>
      <Dialog
        open={isDialogOpen}
        onClick={(e) => {
          e.preventDefault();
        }}
        onClose={() => setIsDialogOpen(false)}
        title='Builder Activity Map'
      >
        <BuilderCardActivityTooltip />
      </Dialog>
    </>
  );
}
