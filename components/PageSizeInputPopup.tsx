import { MoreHoriz } from '@mui/icons-material';
import { IconButton, TextField } from '@mui/material';
import { Stack } from '@mui/system';
import { useState } from 'react';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';
import { DEFAULT_PAGE_SIZE } from 'hooks/usePaginatedData';

type Props = {
  pageSize: number;
  onChange: (pageSize: number) => void;
};

export function PageSizeInputPopup({ pageSize, onChange }: Props) {
  const [pageSizeInput, setPageSizeInput] = useState(pageSize || DEFAULT_PAGE_SIZE);

  return (
    <PopperPopup
      popupContent={
        <Stack px={1.5} py={1}>
          <FieldLabel variant='subtitle2'>Items per page</FieldLabel>
          <TextField
            sx={{ maxWidth: '100px' }}
            type='number'
            value={pageSizeInput}
            onChange={(e) => setPageSizeInput(Number(e.target.value || DEFAULT_PAGE_SIZE))}
            autoFocus
            onKeyDown={(e) => {
              if (e.code === 'Enter') {
                onChange(pageSizeInput);
              }
            }}
          />
        </Stack>
      }
      onClose={() => onChange(pageSizeInput)}
      onOpen={() => setPageSizeInput(pageSize)}
    >
      <IconButton size='small'>
        <MoreHoriz fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
