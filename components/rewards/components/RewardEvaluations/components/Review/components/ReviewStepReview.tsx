import { Box, Card, FormLabel, Stack, Typography } from '@mui/material';

import { useGetRewardPermissions } from 'charmClient/hooks/rewards';
import type { SelectOption } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { AcceptOrRejectButtons } from 'components/rewards/components/RewardApplicationPage/components/AcceptOrRejectButtons';
import { useApplication } from 'components/rewards/hooks/useApplication';
import type { ApplicationWithTransactions } from 'lib/rewards/interfaces';

export function ReviewStepReview({
  reviewers,
  application,
  rewardId
}: {
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
      <Box mb={2}>
        <FormLabel>
          <Typography sx={{ mb: 1 }} variant='subtitle1'>
            Reviewers
          </Typography>
        </FormLabel>
        <UserAndRoleSelect readOnly={true} value={reviewers} onChange={() => {}} />
      </Box>
      {application && rewardPermissions?.review && (
        <Card variant='outlined'>
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
        </Card>
      )}
    </Stack>
  );
}
