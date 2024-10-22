'use client';

import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { AddRepoModal } from './AddRepoModal';

export function AddRepoButton({
  children,
  ...props
}: {
  children: ReactNode;
} & ButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} {...props}>
        {children}
      </Button>
      <AddRepoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={() => {}} />
    </>
  );
}
