import styled from '@emotion/styled';
import type { TypographyTypeMap } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';

const StyledBox = styled(Box)`
  white-space: nowrap;
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
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

function Legend ({ children, helperText, ...props }: TypographyTypeMap['props'] & {children: string | ReactNode; helperText?: string | ReactNode}) {
  return (
    <StyledBox>
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
