import { Box } from '@mui/material';

import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';

import { RewardSubmissionsTable } from './RewardSubmissionsTable';

type Props = {
  rewardId: string;
  onShowApplication?: VoidFunction;
};

export function RewardApplications({ rewardId, onShowApplication }: Props) {
  const { showApplication } = useApplicationDialog();

  const openApplication = (applicationId: string) => {
    showApplication(applicationId);
    setTimeout(() => onShowApplication?.(), 50);
  };

  return (
    <Box>
      <RewardSubmissionsTable rewardId={rewardId} openApplication={openApplication} />
    </Box>
  );
}
