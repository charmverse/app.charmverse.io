import AutorenewIcon from '@mui/icons-material/Autorenew';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useEffect, useRef, useState } from 'react';
import { v4 } from 'uuid';
import { BountyStatusColours } from 'components/bounties/BountyCard';
import { humanFriendlyDate } from 'lib/utilities/dates';

export interface IBountyApplicantListProps {
  bounty: Bounty,
  bountyReassigned?: () => any
}

function createData (id: string, message: string, date: string) {
  return { id, message, date };
}

export function BountyApplicantList ({ bounty, bountyReassigned = () => {} }: IBountyApplicantListProps) {
  const [user] = useUser();
  const [space] = useCurrentSpace();

  const [isAdmin, setIsAdmin] = useState(false);

  const [applications, setApplications] = useState([] as Application []);
  const loading = useRef(true);

  useEffect(() => {
    refreshApplications();
  }, []);

  useEffect(() => {
    if (user && space) {

      const adminRoleFound = user.spaceRoles.some(spaceRole => {
        return spaceRole.spaceId === space.id && spaceRole.role === 'admin';
      });

      setIsAdmin(adminRoleFound);

    }
  }, [user, space]);

  async function refreshApplications () {
    loading.current = true;
    const applicationList = await charmClient.listApplications(bounty.id);
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

  async function assignBounty (assignee: string) {
    await charmClient.assignBounty(bounty.id, assignee);
    bountyReassigned();
  }

  function displayAssignmentButton (application: Application) {
    return (
      isAdmin === true
      && application.createdBy !== bounty.assignee
      // We don't want to reassign a bounty after the work is complete
      && ['complete', 'paid'].indexOf(bounty.status) === -1);
  }

  const applicationsMade = applications.length;

  // Set min height large enough
  const minHeight = applicationsMade === 0 ? undefined : Math.min(300, (100 * applicationsMade));

  return (
    <Box component='div' sx={{ minHeight: `${minHeight}px`, marginBottom: '15px', maxHeight: '70vh', overflowY: 'auto' }}>

      <Table stickyHeader={true} sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead>
          <TableRow>
            <TableCell>
              <AutorenewIcon onClick={refreshApplications} />
              Applicant
            </TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Date</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((application) => (
            <TableRow
              key={application.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell size='small'>
                {application.createdBy}
              </TableCell>
              <TableCell sx={{ maxWidth: '61vw' }}>{application.message}</TableCell>
              <TableCell>{ humanFriendlyDate(application.createdAt, { withTime: true })}</TableCell>
              <TableCell>
                {
                  displayAssignmentButton(application) === true && (
                    <Button onClick={() => {
                      assignBounty(application.createdBy);
                    }}
                    >
                      Assign
                    </Button>
                  )
                }
                {
                  bounty.assignee === application.createdBy && (
                    <Chip label='Assigned' color={BountyStatusColours.assigned} />
                  )
                }
              </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>

    </Box>
  );
}
