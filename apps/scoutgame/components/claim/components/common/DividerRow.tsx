import { TableRow, TableCell } from '@mui/material';

export function DividerRow() {
  return (
    <TableRow sx={{ backgroundColor: 'background.default' }}>
      <TableCell colSpan={3} sx={{ '&.MuiTableCell-root': { py: 0.25, backgroundColor: 'inherit' } }} />
    </TableRow>
  );
}
