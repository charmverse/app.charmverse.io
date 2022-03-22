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

  const copiedApps = applications.slice();

  const userApplicationIndex = copiedApps.findIndex(app => {
    return app.createdBy === user?.id;
  });

  if (userApplicationIndex > 0) {

    const userApplication = copiedApps[userApplicationIndex];

    copiedApps.splice(userApplicationIndex, 1);
    copiedApps.splice(0, 0, userApplication);
  }

  return copiedApps;

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

  let maxHeight: null | number | string = 400;

  let minHeight: null | number | string = applicationsMade === 0 ? 100 : 100 * applicationsMade;

  // Ensure table only starts scrolling once we've received more than a few applications
  if (minHeight > maxHeight) {
    minHeight = null;
    maxHeight = `${maxHeight}px`;
  }
  else {
    // We don't need to change maxHeight to null as minHeight always overrides maxHeight
    minHeight = `${minHeight}px`;
  }

  const sortedApplications = moveUserApplicationToFirstRow(applications, user!);

  return (
    <Box component='div' sx={{ minHeight, maxHeight, overflowY: 'auto' }}>
      <Table stickyHeader sx={{ minWidth: 650 }} aria-label='bounty applicant table'>
        <TableHead sx={{
          background: theme.palette.background.dark,
          '.MuiTableCell-root': {
            background: theme.palette.settingsHeader.background
          },
          zIndex: 9000
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
            {sortedApplications.map((application, applicationIndex) => (
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
                <TableCell align='right' sx={{ gap: 2 }}>
                  {
                      application.createdBy === user?.id && (
                        <Button
                          color='secondary'
                          variant='outlined'
                          onClick={updateApplication}
                          endIcon={<EditOutlinedIcon fontSize='small' />}
                        >
                          Edit
                        </Button>
                      )
                    }

                  {
                    displayAssignmentButton(application) === true && (
                      <Button
                        sx={{ ml: 2 }}
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
                      <Chip sx={{ ml: 2 }} label='Assigned' color={BountyStatusColours.assigned} />
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
