'use client';

import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ManageUserModal } from './ManageUserModal';

export function ManageUserButton({
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
      <ManageUserModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={() => {}} />
    </>
  );
}
