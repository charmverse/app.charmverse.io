import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Box, Divider, IconButton, Stack, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import { useGetReward } from 'charmClient/hooks/rewards';
import UserDisplay from 'components/common/UserDisplay';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { ApplicationMeta } from 'lib/rewards/interfaces';
import { formatDateTime } from 'lib/utilities/dates';
import type { LoggedInUser } from 'models';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

type Props = {
  rewardId: string;
  onShowApplication?: VoidFunction;
  applicationRequired: boolean;
};

function sortApplications(user: LoggedInUser | null) {
  return (appA: ApplicationMeta, appB: ApplicationMeta) => {
    if (appA.createdBy === user?.id) {
      return -1;
    } else if (appB.createdBy === user?.id) {
      return 1;
    }

    const appACreatedAt = typeof appA.createdAt === 'string' ? new Date(appA.createdAt) : appA.createdAt;
    const appBCreatedAt = typeof appB.createdAt === 'string' ? new Date(appB.createdAt) : appB.createdAt;

    return appBCreatedAt.getTime() - appACreatedAt.getTime();
  };
}

function ApplicationRows({
  applications,
  openApplication,
  isApplication
}: {
  isApplication: boolean;
  openApplication: (applicationId: string) => void;
  applications: ApplicationMeta[];
}) {
  const { getMemberById } = useMembers();

  return (
    <Stack>
      <Typography fontWeight='bold' my={1}>
        {isApplication ? 'Applications' : 'Submissions'}
      </Typography>
      <Stack sx={{ width: '100%', overflow: 'auto' }} gap={2} my={1}>
        {applications.map((application) => {
          const member = getMemberById(application.createdBy);

          if (!member) {
            return null;
          }
          return (
            <Stack justifyContent='space-between' flexDirection='row' gap={1} key={application.id} alignItems='center'>
              <Stack gap={1} flexDirection='row' minWidth={200}>
                <UserDisplay avatarSize='medium' userId={member.id} fontSize='small' hideName showMiniProfile />
                <Stack>
                  <Typography>{member.username}</Typography>
                  <Typography variant='subtitle2'>{formatDateTime(application.updatedAt)}</Typography>
                </Stack>
              </Stack>
              <Stack gap={1} flexDirection='row' alignItems='center'>
                <RewardApplicationStatusChip status={application.status} />
                <Tooltip title={`View ${isApplication ? 'application' : 'submission'} details`}>
                  <IconButton size='small'>
                    <PlayArrowIcon fontSize='small' onClick={() => openApplication(application.id)} color='primary' />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          );
        })}

        {applications.length === 0 && (
          <Box
            display='flex'
            justifyContent='center'
            my={3}
            sx={{
              opacity: 0.5,
              mb: 2
            }}
          >
            <Typography variant='subtitle1'>No {isApplication ? 'application' : 'submission'} to display</Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}

export function RewardApplications({ rewardId, onShowApplication, applicationRequired }: Props) {
  const { updateURLQuery } = useCharmRouter();

  const { user } = useUser();

  const { data: reward } = useGetReward({ rewardId });

  const { applications, submissions } = useMemo(() => {
    if (!reward) {
      return {
        applications: [],
        submissions: []
      };
    }

    const submissionStatuses: ApplicationStatus[] = [
      'submission_rejected',
      'review',
      'processing',
      'paid',
      'complete',
      'cancelled'
    ];

    if (applicationRequired) {
      return {
        applications: reward.applications
          .filter((app) => !submissionStatuses.includes(app.status))
          .sort(sortApplications(user)),
        submissions: reward.applications
          .filter((app) => submissionStatuses.includes(app.status))
          .sort(sortApplications(user))
      };
    }

    return {
      applications: [],
      submissions: reward.applications.sort(sortApplications(user))
    };
  }, [applicationRequired, reward, user]);

  if (!reward) {
    return null;
  }

  const openApplication = (applicationId: string) => {
    updateURLQuery({ applicationId });
  };

  if (reward.applications.length === 0) {
    return (
      <>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography fontWeight='bold'>{applicationRequired ? 'Applications' : 'Submissions'}</Typography>
        </Stack>
        <Box display='flex' justifyContent='center' alignItems='center' gap={1}>
          <Typography
            variant='subtitle1'
            sx={{
              opacity: 0.5
            }}
          >
            There are no {applicationRequired ? 'applications' : 'submissions'} yet.
          </Typography>
          <NewWorkButton rewardId={rewardId} />
        </Box>
      </>
    );
  }

  if (applicationRequired) {
    return (
      <Stack gap={1}>
        <ApplicationRows isApplication={false} openApplication={openApplication} applications={submissions} />
        <Stack flex={1} direction='row' justifyContent='flex-end' mb={1}>
          <NewWorkButton rewardId={rewardId} />
        </Stack>
        <Divider
          sx={{
            my: 1
          }}
        />
        <ApplicationRows isApplication openApplication={openApplication} applications={applications} />
      </Stack>
    );
  }

  return (
    <>
      <ApplicationRows isApplication={false} openApplication={openApplication} applications={submissions} />
      <Stack flex={1} direction='row' justifyContent='flex-end' mb={1}>
        <NewWorkButton rewardId={rewardId} />
      </Stack>
    </>
  );
}
