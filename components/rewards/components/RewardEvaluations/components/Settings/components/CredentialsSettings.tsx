import { CredentialSelect } from 'components/credentials/CredentialsSelect';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

export function CredentialsSettings({
  rewardInput,
  readOnly,
  onChange
}: Omit<EvaluationStepSettingsProps, 'evaluation' | 'rewardStatus'>) {
  return (
    <CredentialSelect
      templateType='reward'
      onChange={(templateIds) => {
        onChange({
          selectedCredentialTemplates: templateIds
        });
      }}
      readOnly={readOnly}
      selectedCredentialTemplates={rewardInput?.selectedCredentialTemplates ?? []}
    />
  );
}
