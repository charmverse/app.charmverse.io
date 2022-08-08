import { AvatarGroup, Box, Chip, Tooltip, Typography } from '@mui/material';
import { Bounty } from '@prisma/client';
import Avatar from 'components/common/Avatar';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { AssignedBountyPermissions } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { Contributor } from 'models';
import { useMemo, useState } from 'react';

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
    <Box display='flex' alignItems='center' gap={2}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
        className='octo-propertyname octo-propertyname--readonly'
      >
        Reviewers
      </Typography>

      {
        reviewerNames.roles.length > 0 && (
          <Box display='flex' alignItems='center'>

            {reviewerNames.roles.map(reviewer => {
              return (
                <Chip size='small' key={reviewer.id} label={reviewer.name} color='purple' sx={{ mr: 1 }} />
              );
            })}
            <Typography variant='subtitle2'>(Roles)</Typography>
          </Box>
        )
      }

      {
        reviewerNames.users.length > 0 && (
          <Box display='flex' alignItems='center'>
            <AvatarGroup max={maxVisibleUsers} sx={{ mr: 1 }} onClick={() => setMaxVisibleUsers(maxVisibleUsers + defaultAvatarGroupIncrement)}>
              {
                reviewerNames.users.map(reviewer => {
                  const userName = !reviewer.name ? 'Unknown user. This person has most likely left this workspace.' : (
                    reviewer.name.slice(0, 2).match('0x') ? reviewer.name.slice(2, 3).toUpperCase() : reviewer.name.slice(0, 1).toUpperCase()
                  );

                  return (
                    <Tooltip placement='top' key={reviewer.id} title={!reviewer.name ? userName : reviewer.name}>
                      <Box>
                        <Avatar size='small' name={userName.slice(0, 1)} avatar={reviewer.profilePic as string} />
                      </Box>
                    </Tooltip>
                  );
                })
              }
            </AvatarGroup>
            <Typography variant='subtitle2'>(Users)</Typography>
          </Box>
        )
      }

    </Box>
  );
}
