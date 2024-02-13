import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { IPropertyOption } from 'lib/focalboard/board';

// import { EmptyPlaceholder } from './EmptyPlaceholder';

type CredentialsSelectProps = {
  onChange: (selectedCredentialTemplates: string[]) => void;
  selectedCredentialTemplates?: string[] | null;
  readOnly?: boolean;
};

export function CredentialSelect({ onChange, selectedCredentialTemplates, readOnly }: CredentialsSelectProps) {
  const { space } = useCurrentSpace();

  const { data: credentialTemplates } = useGetCredentialTemplates({ spaceId: space?.id });

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
      options={credentialTemplates?.map(
        (template) => ({ id: template.id, color: 'gray', value: template.name } as IPropertyOption)
      )}
      emptyMessage='+ Add a credential'
    />
  );
}
