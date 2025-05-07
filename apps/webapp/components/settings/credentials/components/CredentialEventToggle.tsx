import type { CredentialEventType } from '@charmverse/core/prisma';
import { Box, FormControlLabel, Switch } from '@mui/material';
import { credentialEventLabels } from '@packages/credentials/constants';
import type { FeatureTitleVariation } from '@packages/features/getFeatureTitle';

import { Typography } from 'components/common/Typography';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export type CredentialToggled = {
  credentialEvent: CredentialEventType;
  selected: boolean;
};

type ToggleProps = {
  onChange: (ev: CredentialToggled) => void;
  checked: boolean;
  disabled?: boolean;
  credentialEvent: CredentialEventType;
};

type LabelFn = (getFeatureTitle: (featureWord: FeatureTitleVariation) => string) => string;

const credentialDescriptionMap: Partial<Record<CredentialEventType, LabelFn>> = {
  proposal_created: (map) => `Issue when a ${map('proposal')} is published`,
  proposal_approved: (map) => `Issue when a ${map('proposal')} is approved`,
  reward_submission_approved: () => `Issue when a submission is approved`
};

export function CredentialEventToggle({ checked, onChange, disabled, credentialEvent }: ToggleProps) {
  const { getFeatureTitle } = useSpaceFeatures();
  return (
    <Box display='flex' justifyContent='flex-start' alignItems='center' gap={2}>
      <FormControlLabel
        sx={{
          margin: 0,
          display: 'flex',
          justifyContent: 'flex-start'
        }}
        control={
          <Box display='flex' gap={2} alignItems='center'>
            <Switch
              disabled={disabled}
              onChange={(ev) => {
                onChange({ credentialEvent, selected: !!ev.target.checked });
              }}
              checked={checked}
            />
          </Box>
        }
        label={
          <Typography fontWeight='bold' sx={{ minWidth: '100px' }}>
            {credentialEventLabels[credentialEvent]?.(getFeatureTitle)}
          </Typography>
        }
        labelPlacement='end'
      />
      <Typography>{credentialDescriptionMap[credentialEvent]?.(getFeatureTitle)}</Typography>
    </Box>
  );
}
