'use client';

import { LoadingButton } from '@mui/lab';
import type { ButtonProps } from '@mui/material';
import type { ReactNode } from 'react';

import { useGETtrigger } from 'hooks/api/helpers';

export function ExportButton({
  children,
  src,
  filename,
  ...props
}: {
  children: ReactNode;
  src: string;
  filename: string;
} & ButtonProps) {
  const { trigger, isMutating, error } = useGETtrigger<undefined, string>(src);
  async function onClick() {
    const response = await trigger();
    const url = window.URL.createObjectURL(new Blob([response], { type: 'text/tsv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  return (
    <LoadingButton loading={isMutating} onClick={onClick} {...props}>
      {children}
    </LoadingButton>
  );
}
