import { AvatarGroup, Box, Chip, Tooltip, Typography } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import Avatar from 'components/common/Avatar';
import { useContributors } from 'hooks/useContributors';
import useRoles from 'hooks/useRoles';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { TargetPermissionGroup } from 'lib/permissions/interfaces';
import { Contributor } from 'models';
import { useMemo, useState } from 'react';

interface BountyReviewersProps {
  submissions: Application[]
  bounty: Bounty
}

export default function BountySlots ({ bounty, submissions }: BountyReviewersProps) {

  const remainingSlots = bounty.maxSubmissions ? bounty.maxSubmissions - countValidSubmissions(submissions) : 0;

  if (!bounty.maxSubmissions) {
    return null;
  }

  return (
    <Box display='flex' alignItems='center' gap={2}>
      <Typography
        sx={{
          fontWeight: 'bold'
        }}
        className='octo-propertyname octo-propertyname--readonly'
      >
        Submissions
      </Typography>

      {
        remainingSlots > 0 && (
          <Box display='flex' alignItems='center'>
            {
              remainingSlots <= 0 ? (
                <Chip size='medium' sx={{ fontWeight: 'bold' }} label='FULL' variant='outlined' color='error' />
              ) : (
                <Chip size='medium' sx={{ fontWeight: 'bold' }} label={`${remainingSlots} spots left`} variant='outlined' color='primary' />
              )
            }
          </Box>
        )
      }

    </Box>
  );
}
