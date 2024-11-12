'use client';

import { styled, TableBody, TableHead } from '@mui/material';

export const StyledTableBody = styled(TableBody)`
  ${({ theme }) => `
  background-color: ${theme.palette.background.dark};
  & .MuiTableCell-root {
    padding: ${theme.spacing(1)};
    border-bottom: 4px solid ${theme.palette.background.default};
    padding-left: ${theme.spacing(1.5)};
    padding-right: ${theme.spacing(1.5)};
    & .MuiTypography-root {
      ${theme.breakpoints.down('md')} {
        font-size: 13.5px;
      }
      ${theme.breakpoints.up('md')} {
        font-size: 16px;
      }
    }
  }
`}
`;

export const StyledTableHead = styled(TableHead)`
  ${({ theme }) => `
  background-color: ${theme.palette.background.dark};
  & .MuiTableCell-root {
    padding: ${theme.spacing(1)};
    border-bottom: 4px solid ${theme.palette.background.default};
    padding-left: ${theme.spacing(1.5)};
    padding-right: ${theme.spacing(1.5)};
    ${theme.breakpoints.down('md')} {
      font-size: 13.5px;
    }
    ${theme.breakpoints.up('md')} {
      font-size: 16px;
    }
  }
`}
`;
