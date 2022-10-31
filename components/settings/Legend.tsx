import styled from '@emotion/styled';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';

const StyledBox = styled(Box)<{ noBorder?: boolean }>`
  white-space: nowrap;
  border-bottom: ${({ noBorder, theme }) => noBorder ? '0' : `1px solid ${theme.palette.divider}`};
  padding-bottom: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(6)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
  ${({ theme }) => `
    ${theme.breakpoints.down('sm')} {
      font-size: 18px;
      padding-bottom: ${theme.spacing(1)};
      margin-bottom: ${theme.spacing(1)};
      margin-top: ${theme.spacing(3)};
    }
  `}
`;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

interface LegendProps extends TypographyProps {
  children: string | ReactNode;
  helperText?: string | ReactNode;
  noBorder?: boolean;
}

function Legend ({ children, helperText, noBorder, ...props }: LegendProps) {
  return (
    <StyledBox noBorder={noBorder}>
      <StyledTypography {...props}>
        {children}
      </StyledTypography>
      {helperText && (
        <Typography color='secondary' mt={0.5} variant='caption' component='p'>
          {helperText}
        </Typography>
      )}
    </StyledBox>
  );
}

export default Legend;
