import { AvatarGroup, Box, Chip, Grid, Tooltip, Typography } from '@mui/material';
import { Bounty } from '@prisma/client';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { AssignedBountyPermissions } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { Contributor } from 'models';
import { useMemo, useState } from 'react';
import Avatar from 'components/common/Avatar';

interface BountyReviewersProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
}

// Initial number of avatars we show, and the number to add each time the user clicks
const defaultAvatarGroupIncrement = 2;

export default function BountyReviewers ({ bounty, permissions }: BountyReviewersProps) {
  const [maxVisibleUsers, setMaxVisibleUsers] = useState<number>(defaultAvatarGroupIncrement);
  const [contributors] = useContributors();
  const { roleups } = useRoles();

  const reviewerNames: {
    roles: ({ id: string, name: string, users: Contributor[] })[]
    users: ({ id: string, name: string, profilePic?: string | null })[]
  } = useMemo(() => {
    const mapped = (permissions?.bountyPermissions.reviewer ?? []).map(reviewer => {

      if (reviewer.group === 'role') {
        const name: string = roleups?.find(r => r.id === reviewer.id)?.name ?? '';
        return {
          ...(reviewer as TargetPermissionGroup<'role'>),
          name,
          users: roleups?.find(r => r.id === reviewer.id)?.users ?? []
        };
      }
      else {
        const reviewerUser: Contributor | undefined = contributors?.find(c => c.id === reviewer.id);
        return {
          ...(reviewer as TargetPermissionGroup<'user'>),
          name: reviewerUser?.username ?? '',
          profilePic: reviewerUser?.avatar
        };

      }

    });

    const reduced = mapped.reduce((reviewersByGroup, reviewer) => {

      if (reviewer.group === 'role') {

        const roleAsReviewer = reviewer as { id: string, name: string, users: Contributor[] };

        reviewersByGroup.roles.push(roleAsReviewer);

        // We want to show users that can review
        const usersToAdd = (roleups.find(r => r.id === roleAsReviewer.id)?.users ?? [])
          .map(u => {
            return {
              id: u.id,
              name: u.username,
              profilePic: u.avatar
            };
          });

        reviewersByGroup.users.push(...usersToAdd);

      }
      else if (reviewer.group === 'user') {
        reviewersByGroup.users.push(reviewer);
      }

      return reviewersByGroup;
    }, {
      roles: [],
      users: []
    } as {
      roles: { id: string, name: string, users: Contributor[] }[]
      users: { id: string, name: string, profilePic?: string | null }[]
    });

    reduced.users = reduced.users.filter((listedUser, index) => {
      // Only look ahead in the array to see if the user is already in the list
      const copiedUser = reduced.users.slice(index + 1);
      // make sure the user isn't already in list because of their roles
      return copiedUser.every(u => u.id !== listedUser.id);
    });

    return reduced;
  }, [bounty, permissions, roleups]);

  return (
    <Grid container item xs={12} sx={{ mt: 3, mb: 4 }}>
      <Grid item xs={12}>
        <Typography variant='h5'>
          Reviewers
        </Typography>

        {
          reviewerNames.roles.length === 0 && reviewerNames.users.length === 0 && (
            <Typography variant='body2'>
              There are no reviewers assigned to this bounty yet.
            </Typography>
          )
        }

      </Grid>

      {
        reviewerNames.roles.length > 0 && (
          <Grid item xs={12} sx={{ mt: 2, mb: 2 }}>
            <Box display='flex'>
              <Typography sx={{ alignItems: 'center', fontWeight: 'bold', mr: 1 }} display='flex'>
                Eligible roles
              </Typography>
              {
                reviewerNames.roles.map(reviewer => {
                  return (
                    <Chip key={reviewer.id} label={reviewer.name} color='purple' sx={{ mr: 1 }} />
                  );
                })
              }
            </Box>

            <AvatarGroup max={3}>

            </AvatarGroup>
          </Grid>
        )
      }

      {
        reviewerNames.users.length > 0 && (
          <Grid item xs={12} sx={{ mt: 1 }} display='flex'>
            <AvatarGroup max={maxVisibleUsers} onClick={() => setMaxVisibleUsers(maxVisibleUsers + defaultAvatarGroupIncrement)}>

              {
                reviewerNames.users.map(reviewer => {

                  const userName = !reviewer.name ? 'Unknown user. This person has most likely left this workspace.' : (
                    reviewer.name.slice(0, 2).match('0x') ? reviewer.name.slice(2, 3).toUpperCase() : reviewer.name.slice(0, 1).toUpperCase()
                  );

                  return (
                    <Tooltip placement='top' key={reviewer.id} title={!reviewer.name ? userName : reviewer.name}>
                      <Box>
                        <Avatar name={userName.slice(0, 1)} avatar={reviewer.profilePic as string} />
                      </Box>

                    </Tooltip>
                  );
                })
              }
            </AvatarGroup>
          </Grid>
        )
      }

    </Grid>
  );
}
