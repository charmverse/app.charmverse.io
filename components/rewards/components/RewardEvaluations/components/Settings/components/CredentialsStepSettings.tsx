import { CredentialSelect } from 'components/credentials/CredentialsSelect';

import type { EvaluationStepSettingsProps } from './EvaluationStepSettings';

export function CredentialsStepSettings({
  rewardInput,
  readOnly,
  onChange
}: Pick<EvaluationStepSettingsProps, 'rewardInput' | 'readOnly' | 'onChange'>) {
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
