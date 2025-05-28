import { styled } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';

type TemplateOptionProps = {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  'data-test'?: string;
};

const StyledButton = styled(Button)`
  justify-content: space-between;
  svg {
    height: 48px;
    width: 48px;
  }
`;

export function TemplateOption({ icon, label, ...props }: TemplateOptionProps) {
  return (
    <StyledButton
      {...props}
      color='secondary'
      variant='outlined'
      sx={{ py: 1 }}
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
    </StyledButton>
  );
}
