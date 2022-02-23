import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { v4 } from 'uuid';

export interface IBountyApplicantListProps {
  bountyId: string
}

function createData (id: string, message: string, date: string) {
  return { id, message, date };
}

const rows = [
  createData(v4(), 'I can do this', new Date().toISOString()),
  createData(v4(), 'I can do this', new Date().toISOString()),
  createData(v4(), 'I can do this', new Date().toISOString()),
  createData(v4(), 'I can do this', new Date().toISOString()),
  createData(v4(), 'I can do this', new Date().toISOString())
];

export function BountyApplicantList ({ bountyId }: IBountyApplicantListProps) {

  const viewerIsBountyCreator: boolean = true;

  return (
    <Box component='div' sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell>Applicant ID</TableCell>
              <TableCell align='right'>Message</TableCell>
              <TableCell align='right'>Date</TableCell>
              {
                viewerIsBountyCreator === true && (
                  <TableCell align='right'>Assign</TableCell>
                )
              }
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component='th' scope='row'>
                  {row.id}
                </TableCell>
                <TableCell align='right'>{row.message}</TableCell>
                <TableCell align='right'>{row.date}</TableCell>
                {
                viewerIsBountyCreator === true && (
                  <TableCell align='right'>
                    <Button>Assign</Button>
                    {' '}
                  </TableCell>
                )
                }
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
