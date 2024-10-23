import { Skeleton, Table, TableBody, TableCell, TableRow } from '@mui/material';

import { DividerRow } from './DividerRow';

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell component='th' scope='row'>
        <Skeleton animation='wave' width='100%' height={20} />
      </TableCell>
      <TableCell scope='row'>
        <Skeleton animation='wave' />
      </TableCell>
      <TableCell scope='row'>
        <Skeleton animation='wave' />
      </TableCell>
    </TableRow>
  );
}

export function LoadingTable() {
  return (
    <Table aria-label='Table loading'>
      <TableBody
        sx={{
          backgroundColor: 'background.dark',
          '& .MuiTableCell-root': { padding: 1, px: 1.5, borderBottom: 'none', width: '33.33%' }
        }}
      >
        {new Array(5).fill('').map(() => (
          <>
            <DividerRow key={Math.random() * 1000} />
            <TableRowSkeleton key={Math.random() * 1000} />
          </>
        ))}
      </TableBody>
    </Table>
  );
}
