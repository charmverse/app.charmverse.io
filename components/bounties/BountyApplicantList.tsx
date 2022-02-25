import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Application, Bounty } from '@prisma/client';
import charmClient from 'charmClient';
import { BountyStatusColours } from 'components/bounties/BountyCard';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { humanFriendlyDate } from 'lib/utilities/dates';
import { useEffect, useState } from 'react';

export interface IBountyApplicantListProps {
  bounty: Bounty,
  bountyReassigned?: () => any
  applications: Application[]
}

function createData (id: string, message: string, date: string) {
  return { id, message, date };
}

export function BountyApplicantList ({ applications, bounty, bountyReassigned = () => {} }: IBountyApplicantListProps) {
  const [user] = useUser();
  const [space] = useCurrentSpace();

  const [isAdmin, setIsAdmin] = useState(false);

  const theme = useTheme();

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (user && space) {

      const adminRoleFound = user.spaceRoles.some(spaceRole => {
        return spaceRole.spaceId === space.id && spaceRole.role === 'admin';
      });

      setIsAdmin(adminRoleFound);

    }
  }, [user, space]);

  // if (loading.current === true) {
  //   return (
  //     <>
  //       <Typography>Loading proposals</Typography>
  //       <CircularProgress/>
  //     </>
  //   );
  // }

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
        <TableHead sx={{
          background: theme.palette.background.dark,
          '& .MuiTableCell-head': {
            fontSize: 18
          },
          '& .MuiTableCell-root': {
            background: 'inherit'
          }
        }}
        >
          <TableRow>
            <TableCell>
              <Box sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              >
                {/* <AutorenewIcon onClick={refreshApplications} /> */}
                Applicant
              </Box>
            </TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Date</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        {applications.length !== 0 && (
          <TableBody>
            {applications.map((application, applicationIndex) => (
              <TableRow
                key={application.id}
                sx={{ backgroundColor: applicationIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
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
        )}

      </Table>
      {applications.length === 0 && (
      <Box
        my={3}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          opacity: 0.5
        }}
      >
        <Typography variant='h6'>
          No applications
        </Typography>
      </Box>
      )}
    </Box>
  );
}
