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
import { Application, Bounty, User } from '@prisma/client';
import charmClient from 'charmClient';
import { BountyStatusColours } from 'components/bounties/BountyCard';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useContributors } from 'hooks/useContributors';
import { getDisplayName } from 'lib/users';
import { humanFriendlyDate } from 'lib/utilities/dates';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

/**
 * @updateApplication callback to parent [bountyId] page that implements application update logic
 */
export interface IBountyApplicantListProps {
  bounty: Bounty,
  bountyReassigned?: () => any
  applications: Application[]
  updateApplication?: () => void
}

function createData (id: string, message: string, date: string) {
  return { id, message, date };
}

function moveUserApplicationToFirstRow (applications: Application [], user: User): Application [] {
  const userApplicationIndex = applications.findIndex(app => {
    return app.createdBy === user?.id;
  });

  if (userApplicationIndex > 0) {

    const userApplication = applications[userApplicationIndex];

    applications.splice(userApplicationIndex);
    applications.splice(0, 0, userApplication);
  }

  return applications;

}

export function BountyApplicantList ({
  applications,
  bounty,
  bountyReassigned = () => {},
  updateApplication = () => {}
}: IBountyApplicantListProps) {
  const [user] = useUser();
  const [space] = useCurrentSpace();
  const [contributors] = useContributors();

  const isAdmin = user && user.spaceRoles.some(spaceRole => {
    return spaceRole.spaceId === space?.id && spaceRole.role === 'admin';
  });

  const theme = useTheme();

  function getContributor (userId: string) {
    return contributors.find(c => c.id === userId);
  }

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
            {moveUserApplicationToFirstRow(applications, user!).map((application, applicationIndex) => (
              <TableRow
                key={application.id}
                sx={{ backgroundColor: applicationIndex % 2 !== 0 ? theme.palette.background.default : theme.palette.background.light, '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell size='small'>
                  {
                    application.createdBy === user?.id ? 'You'
                      : getDisplayName(getContributor(application.createdBy))
                  }
                </TableCell>
                <TableCell sx={{ maxWidth: '61vw' }}>{application.message}</TableCell>
                <TableCell>{ humanFriendlyDate(application.createdAt, { withTime: true })}</TableCell>
                <TableCell>

                  {
                  displayAssignmentButton(application) === true && (
                    <Button
                      onClick={() => {
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

                  {
                    application.createdBy === user?.id && (
                      <Button
                        color='secondary'
                        variant='outlined'
                        sx={{ ml: 2 }}
                        onClick={updateApplication}
                      >
                        <Box component='span' sx={{ pr: 1 }}>Edit</Box>
                        <EditOutlinedIcon />
                      </Button>
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
