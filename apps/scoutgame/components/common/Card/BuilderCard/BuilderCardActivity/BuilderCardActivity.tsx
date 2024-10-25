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
  let gemHeight = size === 'x-small' ? 12 : size === 'small' ? 13.5 : size === 'medium' ? 14.5 : 16;
  if (isMobile) {
    gemHeight *= 0.75;
  }
  return (
    <>
      <Tooltip title={<BuilderCardActivityTooltip />}>
        <Stack
          flexDirection='row'
          gap={{
            xs: 0.75,
            md: 1.25
          }}
          width='100%'
          height={gemHeight}
          px={1}
          mt={0.5}
          alignItems='center'
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setIsDialogOpen(true);
            }
          }}
        >
          {last7DaysGems?.map((gem, index) => {
            const height = gem === 0 ? gemHeight * 0.25 : gem <= 29 ? gemHeight * 0.5 : gemHeight;

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
