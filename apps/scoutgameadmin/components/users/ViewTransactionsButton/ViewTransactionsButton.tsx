'use client';

import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ViewTransactionsModal } from './ViewTransactionsModal';

export function ViewTransactionsButton({
  children,
  scoutId,
  ...props
}: {
  children: ReactNode;
  scoutId: string;
} & ButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)} {...props}>
        {children}
      </Button>
      <ViewTransactionsModal open={isModalOpen} onClose={() => setIsModalOpen(false)} scoutId={scoutId} />
    </>
  );
}
