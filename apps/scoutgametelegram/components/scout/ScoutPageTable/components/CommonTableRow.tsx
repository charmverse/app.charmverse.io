import type { SxProps } from '@mui/material';
import { TableRow } from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';

export const tableRowSx = {
  cursor: 'pointer',
  boxShadow: '2px 2px 2px 0px rgba(0, 0, 0, 0.25)',
  [`& .${tableCellClasses.root}`]: {
    paddingLeft: '6px',
    paddingRight: '6px',
    borderBottom: '1px solid',
    borderBottomColor: 'background.default',
    '&:first-of-type': {
      paddingLeft: {
        xs: '10px',
        md: '50px'
      }
    },
    '&:last-child': {
      paddingRight: {
        xs: '10px',
        md: '75px'
      }
    }
  }
};

export function CommonTableRow({ children, sx }: { children: React.ReactNode; sx?: SxProps }) {
  return <TableRow sx={{ ...tableRowSx, ...sx }}>{children}</TableRow>;
}
