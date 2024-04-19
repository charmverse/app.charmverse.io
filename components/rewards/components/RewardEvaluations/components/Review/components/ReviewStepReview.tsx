import { ThumbUpOutlined as ApprovedIcon, ThumbDownOutlined as RejectedIcon } from '@mui/icons-material';
import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { AcceptOrRejectButtons } from 'components/rewards/components/RewardApplicationPage/components/AcceptOrRejectButtons';
import { useApplication } from 'components/rewards/hooks/useApplication';
import type { ApplicationWithTransactions } from 'lib/rewards/interfaces';
import type { RewardEvaluation } from 'pages/api/spaces/[id]/rewards/workflows';

export function ReviewStepReview({
  reviewers,
  application,
  rewardId,
  evaluation
}: {
  evaluation: RewardEvaluation;
  reviewers: SelectOption[];
  application?: ApplicationWithTransactions;
  rewardId: string;
}) {
  const { data: rewardPermissions } = useGetRewardPermissions({ rewardId });

  const { reviewApplication, hasApplicationSlots } = useApplication({
    applicationId: application?.id ?? ''
  });

  return (
    <Stack>
      <Box>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Reviewers
          </Typography>
        </FormLabel>
        <UserAndRoleSelect readOnly={true} value={reviewers} onChange={() => {}} />
      </Box>
      {application && (
        <>
          <FormLabel sx={{ mt: 2 }}>
            <Typography variant='subtitle1'>Result</Typography>
          </FormLabel>
          <Card variant='outlined'>
            {!evaluation.result && (
              <Box display='flex' justifyContent='space-between' alignItems='center' p={1} px={2}>
                <FormLabel>
                  <Typography component='span' variant='subtitle1'>
                    Submit review:
                  </Typography>
                </FormLabel>
                <Box display='flex' justifyContent='flex-end' gap={1}>
                  {application.status === 'applied' && (
                    <AcceptOrRejectButtons
                      onConfirmReview={(decision) => reviewApplication({ decision })}
                      reviewType='application'
                      readOnly={!rewardPermissions?.approve_applications}
                      hasApplicationSlots={hasApplicationSlots}
                      usePaleColor
                    />
                  )}
                  {application.status === 'review' && (
                    <AcceptOrRejectButtons
                      onConfirmReview={(decision) => reviewApplication({ decision })}
                      reviewType='submission'
                      readOnly={!rewardPermissions?.review}
                      hasApplicationSlots={hasApplicationSlots}
                      usePaleColor
                    />
                  )}
                </Box>
              </Box>
            )}
            {evaluation.result === 'pass' && (
              <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
                <ApprovedIcon color='success' />
                <Typography variant='body2'>Accepted</Typography>
              </Stack>
            )}
            {evaluation.result === 'fail' && (
              <Stack flexDirection='row' gap={1} alignItems='center' justifyContent='center' p={2}>
                <RejectedIcon color='error' />
                <Typography variant='body2'>Rejected</Typography>
              </Stack>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}
