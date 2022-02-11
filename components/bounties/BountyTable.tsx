import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import type { TBountyCard } from 'models/Bounty';

interface Props {
  items: Array<TBountyCard>;
}

export default function BountyTable (props: Props) {
  const { items } = props;
  // xtungvo TODO: update styling
  return (
    <Table sx={{ minWidth: 650 }} aria-label='simple table'>
      <TableHead>
        <TableRow>
          <TableCell align='center'>Title</TableCell>
          <TableCell align='center'>Description</TableCell>
          <TableCell align='center'>Suggested By</TableCell>
          <TableCell align='center'>Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component='th' scope='row'>
              {row.title}
            </TableCell>
            {/* // xtungvo TODO: content render here */}
            <TableCell>{JSON.stringify(row.description)}</TableCell>
            <TableCell>{row.author}</TableCell>
            <TableCell>{row.createdAt.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
