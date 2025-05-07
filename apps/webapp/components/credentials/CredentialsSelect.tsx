import type { AttestationType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import AddIcon from '@mui/icons-material/Add';
import type { SxProps, Theme } from '@mui/material';
import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { useMemo, type HTMLAttributes } from 'react';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { useSettingsDialog } from 'hooks/useSettingsDialog';

const ADD_CREDENTIAL_TEMPLATE = 'ADD_CREDENTIAL_TEMPLATE' as const;

// import { EmptyPlaceholder } from './EmptyPlaceholder';
type CredentialTemplateOption =
  | Pick<CredentialTemplate, 'id' | 'name' | 'credentialEvents'>
  | typeof ADD_CREDENTIAL_TEMPLATE;

type CredentialsSelectProps = {
  onChange?: (templateIds: string[]) => void;
  selectedCredentialTemplates?: string[] | null;
  readOnly?: boolean;
  sx?: SxProps<Theme>;
  templateType: AttestationType;
} & Omit<HTMLAttributes<HTMLLIElement>, 'onChange'>;

function CredentialComponent({
  credentialEvents,
  id,
  name,
  ...props
}: Pick<CredentialTemplate, 'id' | 'name' | 'credentialEvents'>) {
  return (
    <Box {...props}>
      <Stack>
        <Chip variant='outlined' key={id} size='small' label={name} />
        {/* <Typography variant='caption' fontWeight='bold'>
          {name}
        </Typography> */}
        {/* <Box display='flex' gap={2}>
          {credentialEvents.map((ev) => {
            const title = credentialEventLabels[ev]?.(getFeatureTitle);
            return <Chip variant='outlined' key={ev} size='small' title={title} label={title} />;
          })}
        </Box> */}
      </Stack>
    </Box>
  );
}

export function CredentialSelect({
  onChange,
  selectedCredentialTemplates,
  readOnly,
  templateType,
  sx
}: CredentialsSelectProps) {
  const { credentialTemplates, proposalCredentialTemplates, rewardCredentialTemplates } = useGetCredentialTemplates();

  const { openSettings } = useSettingsDialog();

  const baseOptions = useMemo(() => {
    const options =
      templateType === 'proposal'
        ? proposalCredentialTemplates
        : templateType === 'reward'
          ? rewardCredentialTemplates
          : ([] as CredentialTemplate[]);

    return options ?? [];
  }, [proposalCredentialTemplates, rewardCredentialTemplates, templateType]);

  const filteredValues = useMemo(
    () => [...(baseOptions ?? []).filter((opt) => selectedCredentialTemplates?.includes(opt.id)).map((v) => v.id)],
    [baseOptions, selectedCredentialTemplates]
  );

  if (!credentialTemplates) {
    return null;
  }

  if (readOnly) {
    return (
      <SelectPreview
        value={filteredValues}
        wrapColumn
        options={credentialTemplates.map((template) => ({ ...template, color: 'gray' })) ?? []}
      />
    );
  }

  return (
    <Box>
      <Autocomplete<CredentialTemplateOption, true, true, true>
        sx={{ minWidth: 150, ...sx }}
        forcePopupIcon
        onChange={(_, _value) => {
          if (_value) {
            onChange?.(
              _value
                .filter((v) => (typeof v === 'string' && stringUtils.isUUID(v)) || !!(v as CredentialTemplate).id)
                .map((v) => (typeof v === 'string' ? v : (v as CredentialTemplate).id))
            );
          } else {
            onChange?.([]);
          }
        }}
        isOptionEqualToValue={(opt, val) => (typeof opt === 'object' ? opt.id === val : false)}
        getOptionLabel={(option) => (typeof option === 'string' ? '' : option.name)}
        multiple
        data-test='token-list'
        value={filteredValues}
        // onInputChange={(event, newInputValue) => {
        //   if (newInputValue !== ADD_CREDENTIAL_TEMPLATE) {
        //     setInputValue(newInputValue);
        //   }
        // }}
        options={[...baseOptions, ADD_CREDENTIAL_TEMPLATE]}
        disableCloseOnSelect
        filterSelectedOptions
        disableClearable
        autoHighlight
        size='small'
        renderOption={(props, option) => {
          if (option === ADD_CREDENTIAL_TEMPLATE) {
            return (
              <Box
                {...props}
                data-test='add-credential-template'
                component='li'
                onClick={() => openSettings('credentials')}
              >
                <AddIcon color='secondary' sx={{ mr: '5px' }} />
                <Typography variant='body2'>Add a credential</Typography>
              </Box>
            );
          }

          return <CredentialComponent {...option} {...props} key={option.id} />;
        }}
        renderTags={(value: any[], getTagProps) => {
          return value.map((val, index) => {
            const matchingOption = baseOptions.find((_opt) => _opt.id === val);
            if (matchingOption) {
              return (
                <Chip
                  {...getTagProps({ index })}
                  size='small'
                  variant='outlined'
                  key={val}
                  label={matchingOption.name}
                  // onDelete={() => {
                  //   _onChange([]);
                  // }}
                />
              );
            }
            return null;
          });
        }}
        renderInput={(params) => {
          return (
            <TextField
              {...params}
              variant='outlined'
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
                placeholder: selectedCredentialTemplates?.length ? '' : '+ Select a credential'
              }}
            />
          );
        }}
        disabled={readOnly}
        readOnly={readOnly}
      />
    </Box>
  );
}
