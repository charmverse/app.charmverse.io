import { AvatarGroup, Box, Chip, Tooltip, Typography } from '@mui/material';
import type { Bounty } from '@prisma/client';
import { useMemo, useState } from 'react';

import Avatar from 'components/common/Avatar';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import { useMembers } from 'hooks/useMembers';
import useRoles from 'hooks/useRoles';
import type { BountyPermissions } from 'lib/bounties';
import type { Member } from 'lib/members/interfaces';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

type ReviewersData = {
  roles: ({ id: string, name: string, users: Member[] })[];
  users: ({ id: string, name: string, profilePic?: string | null, hasNftAvatar?: boolean })[];
}

interface BountyReviewersProps {
  permissions: Partial<BountyPermissions>;
  bounty: Bounty;
}

// Initial number of avatars we show, and the number to add each time the user clicks
const defaultAvatarGroupIncrement = 2;

export default function BountyReviewers ({ bounty, permissions }: BountyReviewersProps) {
  const [maxVisibleUsers, setMaxVisibleUsers] = useState<number>(defaultAvatarGroupIncrement);
  const { members } = useMembers();
  const { roleups } = useRoles();

  const reviewerNames: ReviewersData = useMemo(() => {
    const mapped = (permissions.reviewer ?? []).map(reviewer => {
      if (reviewer.group === 'role') {
        const name: string = roleups?.find(r => r.id === reviewer.id)?.name ?? '';
        return {
          ...(reviewer as TargetPermissionGroup<'role'>),
          name,
          users: roleups?.find(r => r.id === reviewer.id)?.users ?? []
        };
      }
      else {
        const reviewerUser: Member | undefined = members?.find(c => c.id === reviewer.id);
        return {
          ...(reviewer as TargetPermissionGroup<'user'>),
          name: reviewerUser?.username ?? '',
          profilePic: reviewerUser?.avatar,
          hasNftAvatar: reviewerUser?.hasNftAvatar
        };

      }

    });

    const reduced = mapped.reduce((reviewersByGroup, reviewer) => {

      if (reviewer.group === 'role') {

        const roleAsReviewer = reviewer as { id: string, name: string, users: Member[] };

        reviewersByGroup.roles.push(roleAsReviewer);

        // We want to show users that can review
        const usersToAdd = (roleups.find(r => r.id === roleAsReviewer.id)?.users ?? [])
          .map(u => {
            return {
              id: u.id,
              name: u.username,
              profilePic: u.avatar,
              hasNftAvatar: hasNftAvatar(u)
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
    } as ReviewersData);

    reduced.users = reduced.users.filter((listedUser, index) => {
      // Only look ahead in the array to see if the user is already in the list
      const copiedUser = reduced.users.slice(index + 1);
      // make sure the user isn't already in list because of their roles
      return copiedUser.every(u => u.id !== listedUser.id);
    });

    return reduced;
  }, [bounty, permissions, roleups]);

  const hasMultipleReviewers = (reviewerNames.users.length > 1 || reviewerNames.roles.length > 0);

  return (
    <Box className='octo-propertyrow' display='flex' alignItems='center' gap={2}>
      <div className='octo-propertyname octo-propertyname--readonly'>
        <Button>Reviewer{hasMultipleReviewers ? 's' : ''}</Button>
      </div>

      {
        reviewerNames.roles.length > 0 && (
          <Box display='flex' alignItems='center'>

            {reviewerNames.roles.map(reviewer => {
              return (
                <Chip size='small' key={reviewer.id} label={reviewer.name} color='purple' sx={{ mr: 1 }} />
              );
            })}
            {reviewerNames.users.length > 0 && <Typography variant='subtitle2'>(Roles)</Typography>}
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
                        <Avatar size='small' name={userName.slice(0, 1)} avatar={reviewer.profilePic as string} isNft={reviewer.hasNftAvatar} />
                      </Box>
                    </Tooltip>
                  );
                })
              }
            </AvatarGroup>
            {reviewerNames.roles.length > 0 && <Typography variant='subtitle2'>(Users)</Typography>}
          </Box>
        )
      }

    </Box>
  );
}
