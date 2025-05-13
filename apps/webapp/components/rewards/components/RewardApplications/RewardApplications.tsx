import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { Box, Divider, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import type { LoggedInUser } from '@packages/profile/getUser';
import { useMemo } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { NewWorkButton } from 'components/rewards/components/RewardApplications/NewWorkButton';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { submissionStatuses } from '@packages/lib/rewards/constants';
import type { ApplicationMeta, RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { formatDate, formatDateTime } from '@packages/lib/utils/dates';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

type Props = {
  reward: RewardWithUsers;
  applicationRequired: boolean;
};

function sortApplications(user: LoggedInUser | null) {
  return (appA: ApplicationMeta, appB: ApplicationMeta) => {
    const isApplication1CreatedByUser = appA.createdBy === user?.id;
    const isApplication2CreatedByUser = appB.createdBy === user?.id;
    const application1CreatedAt = typeof appA.createdAt === 'string' ? new Date(appA.createdAt) : appA.createdAt;
    const application2CreatedAt = typeof appB.createdAt === 'string' ? new Date(appB.createdAt) : appB.createdAt;

    if (isApplication1CreatedByUser && isApplication2CreatedByUser) {
      return application2CreatedAt.getTime() - application1CreatedAt.getTime();
    }

    if (isApplication1CreatedByUser) {
      return -1;
    } else if (isApplication2CreatedByUser) {
      return 1;
    }

    return application2CreatedAt.getTime() - application1CreatedAt.getTime();
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
  const { navigateToSpacePath } = useCharmRouter();

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
            <Grid container display='flex' gap={2} key={application.id} alignItems='center' minWidth={500}>
              <Grid item xs={4} display='flex' flexDirection='row' gap={1}>
                <UserDisplay avatarSize='small' userId={member.id} fontSize='small' hideName showMiniProfile />
                <Typography
                  sx={{
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {member.username}
                </Typography>
              </Grid>

              <Grid item xs={2}>
                <Tooltip title={`Updated at ${formatDateTime(application.updatedAt)}`}>
                  <Typography whiteSpace='nowrap' variant='subtitle2' width='fit-content'>
                    {formatDate(application.updatedAt, { withYear: true })}
                  </Typography>
                </Tooltip>
              </Grid>

              <Grid item xs={3}>
                <RewardApplicationStatusChip
                  sx={{
                    width: 'fit-content'
                  }}
                  status={application.status}
                />
              </Grid>

              <Grid item xs={1}>
                <Tooltip title={`View ${isApplication ? 'application' : 'submission'} details`}>
                  <IconButton
                    size='small'
                    onClick={() => {
                      navigateToSpacePath(`/rewards/applications/${application.id}`);
                    }}
                  >
                    <ArrowForwardIosIcon fontSize='small' color='secondary' />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
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

export function RewardApplications({ applicationRequired, reward }: Props) {
  const { updateURLQuery } = useCharmRouter();
  const { user } = useUser();

  const { applications, submissions } = useMemo(() => {
    if (!reward) {
      return {
        applications: [],
        submissions: []
      };
    }

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
      <Stack my={1}>
        <Stack direction='row' alignItems='center' justifyContent='space-between'>
          <Typography fontWeight='bold'>{applicationRequired ? 'Applications' : 'Submissions'}</Typography>
        </Stack>
        <Stack justifyContent='center' alignItems='center' gap={1}>
          <Typography
            variant='subtitle1'
            sx={{
              opacity: 0.5
            }}
          >
            There are no {applicationRequired ? 'applications' : 'submissions'} yet.
          </Typography>
          <NewWorkButton reward={reward} />
        </Stack>
      </Stack>
    );
  }

  if (applicationRequired) {
    return (
      <>
        <Stack flex={1} direction='row' my={1}>
          <NewWorkButton reward={reward} />
        </Stack>
        <ApplicationRows isApplication={false} openApplication={openApplication} applications={submissions} />
        <Divider
          sx={{
            my: 1
          }}
        />
        <ApplicationRows isApplication openApplication={openApplication} applications={applications} />
      </>
    );
  }

  return (
    <>
      <Stack flex={1} direction='row' my={1}>
        <NewWorkButton reward={reward} />
      </Stack>
      <ApplicationRows isApplication={false} openApplication={openApplication} applications={submissions} />
    </>
  );
}
