import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { Bounty } from '@prisma/client';

interface Props {
  items: Bounty[];
}

export default function BountyTable (props: Props) {
  return (
    <Table sx={{ minWidth: 650 }} aria-label='simple table'>
      <TableHead>
        <TableRow>
          <TableCell align='center'>Title</TableCell>
          <TableCell align='center'>Suggested By</TableCell>
          <TableCell align='center'>Date</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.items.map((row) => (
          <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component='th' scope='row'>
              {row.title}
            </TableCell>
            <TableCell>{row.author}</TableCell>
            <TableCell>{row.createdAt.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
