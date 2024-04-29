import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { PersonaModal } from 'components/settings/integrations/components/PersonaModal';
import { SynapsModal } from 'components/settings/integrations/components/SynapsModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';

type KycStepReviewActionProps = {
  userId?: string;
  readOnly?: boolean;
};

export function KycStepSettings({ readOnly, userId }: KycStepReviewActionProps) {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();

  const synapsEnabled = !readOnly && space?.kycOption === 'synaps';
  const personaEnabled = !readOnly && space?.kycOption === 'persona';

  return (
    <Stack gap={1.5}>
      <Typography variant='subtitle1' color='secondary'>
        {!space?.kycOption
          ? 'No KYC option selected. Please contact your space admin to enable the KYC option.'
          : 'KYC is required for this step.'}
      </Typography>
      {synapsEnabled && <SynapsModal spaceId={space.id} isAdmin={isAdmin} userId={userId} />}
      {personaEnabled && <PersonaModal spaceId={space.id} isAdmin={isAdmin} userId={userId} />}
    </Stack>
  );
}
