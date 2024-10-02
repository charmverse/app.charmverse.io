import { Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

function TableRowSkeleton() {
  return (
    <TableRow
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
        '& .MuiTableCell-root': { p: 2, borderBottom: '1px solid', borderBottomColor: 'background.default' }
      }}
    >
      <TableCell component='th' scope='row'>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Skeleton animation='wave' variant='circular' width={20} height={20} />
          <Skeleton animation='wave' width='100%' height={20} />
        </Stack>
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
    <TableContainer component={Paper} sx={{ py: 2 }}>
      <Table aria-label='Table loading' size='small'>
        <TableBody>
          {new Array(10).fill('').map(() => (
            <TableRowSkeleton key={Math.random() * 1000} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
