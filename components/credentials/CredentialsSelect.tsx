import type { AttestationType, CredentialTemplate } from '@charmverse/core/prisma-client';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/databases/board';

// import { EmptyPlaceholder } from './EmptyPlaceholder';

type CredentialsSelectProps = {
  onChange: (selectedCredentialTemplates: string[]) => void;
  selectedCredentialTemplates?: string[] | null;
  readOnly?: boolean;
  templateType: AttestationType;
};

export function CredentialSelect({
  onChange,
  selectedCredentialTemplates,
  readOnly,
  templateType
}: CredentialsSelectProps) {
  const { credentialTemplates, proposalCredentialTemplates, rewardCredentialTemplates } = useGetCredentialTemplates();

  function _onChange(val: string | string[]) {
    if (Array.isArray(val)) {
      onChange(val);
    } else {
      onChange([val]);
    }
  }

  if (!credentialTemplates) {
    return null;
  }

  if (readOnly && !selectedCredentialTemplates?.length) {
    return null;
  }

  const options = (
    templateType === 'proposal'
      ? proposalCredentialTemplates
      : templateType === 'reward'
      ? rewardCredentialTemplates
      : []
  ) as CredentialTemplate[];

  return (
    <TagSelect
      onChange={_onChange}
      propertyValue={selectedCredentialTemplates as any}
      canEditOptions={false}
      multiselect
      showEmpty
      readOnly={readOnly}
      readOnlyMessage='You cannot add a credential'
      noOptionsText='No credentials found'
      options={options.map((template) => ({ id: template.id, color: 'gray', value: template.name } as IPropertyOption))}
      emptyMessage='+ Add a credential'
    />
  );
}
