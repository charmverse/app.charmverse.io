import { Check, MoreHoriz } from '@mui/icons-material';
import { IconButton, MenuItem, Typography, Stack } from '@mui/material';

import FieldLabel from 'components/common/form/FieldLabel';
import PopperPopup from 'components/common/PopperPopup';

type Props = {
  pageSize: number;
  onChange: (pageSize: number) => void;
};

const pageSizeOptions = [10, 25, 50, 100];

export function PageSizeInputPopup({ pageSize, onChange }: Props) {
  return (
    <PopperPopup
      closeOnClick
      popupContent={
        <Stack py={1}>
          <Stack px={1.5}>
            <FieldLabel variant='subtitle2'>Items per page</FieldLabel>
          </Stack>
          {pageSizeOptions.map((option) => (
            <MenuItem
              key={option}
              sx={{ textTransform: 'capitalize', display: 'flex', gap: 1, justifyContent: 'space-between' }}
              onClick={() => {
                onChange(option);
              }}
            >
              <Stack flexDirection='row' gap={1} alignContent='center'>
                <Typography variant='subtitle1'>{option} pages</Typography>
              </Stack>

              {option === pageSize && <Check fontSize='small' />}
            </MenuItem>
          ))}
        </Stack>
      }
    >
      <IconButton size='small'>
        <MoreHoriz fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
