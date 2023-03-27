import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noBorder'
})<{ noBorder?: boolean }>`
  white-space: nowrap;
  border-bottom: ${({ noBorder, theme }) => (noBorder ? '0' : `1px solid ${theme.palette.divider}`)};
`;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

interface LegendProps extends TypographyProps {
  children: string | ReactNode;
  helperText?: string | ReactNode;
  noBorder?: boolean;
  mb?: number;
  pb?: number;
}

function Legend({ children, helperText, noBorder, mb = 2, pb = 2, ...props }: LegendProps) {
  return (
    <StyledBox noBorder={noBorder} mb={mb} pb={pb}>
      <StyledTypography noWrap {...props}>
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
