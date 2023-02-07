import { KeyboardArrowRight } from '@mui/icons-material';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';

type TemplateOptionProps = {
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
};

export function TemplateOption({ icon, label, onSelect }: TemplateOptionProps) {
  return (
    <Button
      onClick={onSelect}
      color='inherit'
      variant='outlined'
      sx={{ justifyContent: 'space-between', py: 2, fontWeight: 'bold' }}
      fullWidth
      endIcon={<KeyboardArrowRight />}
      size='large'
    >
      <Box display='flex' gap={2} alignItems='center'>
        {icon}
        {label}
      </Box>
    </Button>
  );
}
