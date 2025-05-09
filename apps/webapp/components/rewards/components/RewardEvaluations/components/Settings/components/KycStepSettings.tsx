import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Link from 'components/common/Link';
import { PersonaModal } from 'components/settings/integrations/components/KYC/PersonaModal';
import { SynapsModal } from 'components/settings/integrations/components/KYC/SynapsModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

type KycStepReviewActionProps = {
  userId?: string;
  readOnly?: boolean;
};

export function KycStepSettings({ readOnly, userId }: KycStepReviewActionProps) {
  const { space } = useCurrentSpace();
  const isAdmin = useIsAdmin();
  const { openSettings } = useSettingsDialog();

  const synapsEnabled = !readOnly && space?.kycOption === 'synaps';
  const personaEnabled = !readOnly && space?.kycOption === 'persona';

  return (
    <Stack gap={1.5}>
      <Typography variant='subtitle1' color='secondary'>
        {space?.kycOption ? (
          `Identity verification via ${space.kycOption} KYC.`
        ) : (
          <>
            There are no KYC providers available. Admins can integrate a KYC provider in{' '}
            <Link
              onClick={() => openSettings('integrations')}
              sx={{ display: 'inline-block', cursor: 'pointer' }}
              color='primary.main'
            >
              settings
            </Link>
            .
          </>
        )}
      </Typography>
      {synapsEnabled && <SynapsModal spaceId={space.id} isAdmin={isAdmin} userId={userId} />}
      {personaEnabled && <PersonaModal spaceId={space.id} isAdmin={isAdmin} userId={userId} />}
    </Stack>
  );
}
