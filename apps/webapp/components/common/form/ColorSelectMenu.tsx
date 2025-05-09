import CheckIcon from '@mui/icons-material/Check';
import { Box, MenuItem, Stack, Typography } from '@mui/material';

import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';

import FieldLabel from './FieldLabel';

export function ColorSelectMenu({
  selectedColor,
  onChange,
  hideLabel
}: {
  selectedColor: BrandColor;
  hideLabel?: boolean;
  onChange: (color: BrandColor) => void;
}) {
  return (
    <>
      {!hideLabel ? (
        <Stack p={1} pb={0}>
          <FieldLabel variant='subtitle2'>Color</FieldLabel>
        </Stack>
      ) : null}
      {brandColorNames.map((color) => (
        <MenuItem
          key={color}
          sx={{ textTransform: 'capitalize', display: 'flex', gap: 1, justifyContent: 'space-between' }}
          onClick={(e) => {
            e.stopPropagation();
            onChange(color);
          }}
        >
          <Stack flexDirection='row' gap={1} alignContent='center'>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '20%',
                backgroundColor: (theme) => theme.palette[color].main
              }}
            />
            <Typography variant='subtitle1'>{color}</Typography>
          </Stack>

          {color === selectedColor && <CheckIcon fontSize='small' />}
        </MenuItem>
      ))}
    </>
  );
}
