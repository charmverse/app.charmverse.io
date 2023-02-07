import { KeyboardArrowRight } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';

type TemplateOptionProps = {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  'data-test'?: string;
};

export function TemplateOption({ icon, label, ...props }: TemplateOptionProps) {
  return (
    <Button
      {...props}
      color='secondary'
      variant='outlined'
      sx={{ justifyContent: 'space-between', py: 2 }}
      fullWidth
      endIcon={<KeyboardArrowRight />}
      size='large'
    >
      <Box display='flex' gap={2} alignItems='center'>
        {icon}
        <Typography color='textPrimary' fontWeight='bold'>
          {label}
        </Typography>
      </Box>
    </Button>
  );
}
