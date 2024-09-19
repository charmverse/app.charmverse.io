import { Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';

function TableRowSkeleton() {
  return (
    <TableRow
      sx={{
        '&:last-child td, &:last-child th': { border: 0 },
        '& .MuiTableCell-root': { p: '6px', borderBottom: '1px solid', borderBottomColor: 'background.default' }
      }}
    >
      <TableCell component='th' scope='row'>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Skeleton variant='rectangular' width={20} height={20} sx={{ borderRadius: '50%' }} />
          <Skeleton animation='wave' width='100%' height='20px' />
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
          {new Array(6).fill('').map(() => (
            <TableRowSkeleton key={Math.random() * 1000} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
