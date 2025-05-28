import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import type { TypographyProps } from '@mui/material/Typography';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type LegendProps = TypographyProps & {
  children: string | ReactNode;
  helperText?: string | ReactNode;
  noBorder?: boolean;
  mb?: number;
  pb?: number;
  wrap?: boolean;
};

const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'noBorder' && prop !== 'wrap'
})<{ noBorder?: boolean; wrap?: boolean }>`
  white-space: ${({ wrap }) => (wrap ? 'normal' : 'nowrap')};
  border-bottom: ${({ noBorder, theme }) => (noBorder ? '0' : `1px solid ${theme.palette.divider}`)};
`;

const StyledTypography = styled(Typography)`
  font-size: 24px;
  font-weight: bold;
`;

function Legend({ children, helperText, noBorder, mb = 1, pb = 0.5, wrap, ...props }: LegendProps) {
  return (
    <StyledBox noBorder={noBorder} mb={mb} pb={pb} wrap={wrap}>
      <StyledTypography noWrap={!wrap} {...props}>
        {children}
      </StyledTypography>
      {helperText && (
        <Typography
          color='secondary'
          mt={0.5}
          variant='caption'
          component='p'
          sx={{
            hyphens: 'auto',

            whiteSpace: 'normal'
          }}
        >
          {helperText}
        </Typography>
      )}
    </StyledBox>
  );
}

export default Legend;
