import { useState, useRef, useEffect } from 'react';
import { Application } from '@prisma/client';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { v4 } from 'uuid';
import { useUser } from 'hooks/useUser';
import charmClient from 'charmClient';

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
  const [user] = useUser();
  const [applications, setApplications] = useState([] as Application []);
  const loading = useRef(true);

  useEffect(() => {
    refreshApplications();
  }, []);

  const viewerCanAssignBounty: boolean = true;

  async function refreshApplications () {
    loading.current = true;
    const applicationList = await charmClient.listApplications(bountyId);
    loading.current = false;
    setApplications(applicationList);
  }

  if (loading.current === true) {
    return (
      <>
        <Typography>Loading proposals</Typography>
        <CircularProgress></CircularProgress>
      </>
    );
  }

  const applicationsMade = applications.length;

  // Set min height large enough
  const minHeight = applicationsMade === 0 ? undefined : Math.min(300, (100 * applicationsMade));

  return (
    <Box component='div' sx={{ minHeight: `${minHeight}px`, marginBottom: '15px', maxHeight: '50vh', overflowY: 'auto' }}>

      <Table stickyHeader={true} sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead>
          <TableRow>
            <TableCell>
              <AutorenewIcon onClick={refreshApplications} />
              Applicant ID
            </TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Date</TableCell>
            {
                viewerCanAssignBounty === true && (
                  <TableCell>Assign</TableCell>
                )
              }
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((application) => (
            <TableRow
              key={application.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell size='small'>
                {application.applicantId}
              </TableCell>
              <TableCell>{application.message}</TableCell>
              <TableCell>{application.createdAt}</TableCell>
              {
                viewerCanAssignBounty === true && (
                  <TableCell>
                    <Button>Assign</Button>
                    {' '}
                  </TableCell>
                )
                }
            </TableRow>
          ))}
        </TableBody>
      </Table>

    </Box>
  );
}
