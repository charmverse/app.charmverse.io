'use client';

import type { BuilderStatus } from '@charmverse/core/prisma';
import { Button, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useState } from 'react';

import { AddBuilderModal } from './AddBuilderModal';

export function BuilderStatusButton({
  builderStatus,
  userId,
  ...props
}: {
  builderStatus: BuilderStatus | null;
  userId: string;
} & ButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  if (builderStatus === 'approved') {
    return <Typography color='success'>Approved</Typography>;
  } else if (builderStatus === 'rejected') {
    return <Typography color='error'>Rejected</Typography>;
  } else if (builderStatus === 'banned') {
    return <Typography color='error'>Suspended</Typography>;
  } else if (builderStatus === 'applied') {
    return (
      <>
        <Button size='small' onClick={() => setIsModalOpen(true)} {...props}>
          Review
        </Button>
        <AddBuilderModal userId={userId} open={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={() => {}} />
      </>
    );
  } else {
    return (
      <>
        <Button size='small' onClick={() => setIsModalOpen(true)} {...props}>
          Add Builder
        </Button>
        <AddBuilderModal userId={userId} open={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={() => {}} />
      </>
    );
  }
}
