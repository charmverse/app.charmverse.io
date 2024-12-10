import type { SxProps } from '@mui/material';
import { TableRow } from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';

const tableRowSx = {
  boxShadow: '2px 2px 2px 0px rgba(0, 0, 0, 0.25)',
  [`& .${tableCellClasses.root}`]: {
    paddingLeft: '6px',
    paddingRight: '6px',
    borderBottom: '1px solid',
    borderBottomColor: 'background.default',
    '&:first-of-type': {
      paddingLeft: {
        xs: '10px',
        md: '15px'
      }
    },
    '&:last-child': {
      paddingRight: {
        xs: '10px',
        md: '15px'
      }
    }
  }
};

export function CommonTableRow({ children, sx }: { children: React.ReactNode; sx?: SxProps }) {
  return <TableRow sx={{ ...tableRowSx, ...sx }}>{children}</TableRow>;
}
