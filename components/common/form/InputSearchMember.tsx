import styled from '@emotion/styled';
import EmailIcon from '@mui/icons-material/Email';
import type { AutocompleteChangeReason, AutocompleteProps } from '@mui/material';
import { Autocomplete, TextField } from '@mui/material';
import type { ReactNode } from 'react';
import { createRef, useEffect, useState } from 'react';
import { v4 } from 'uuid';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import { isValidEmail } from 'lib/utils/strings';

const renderDiv = (props: any & { children: ReactNode }) => <div>{props.children}</div>;

interface IMembersFilter {
  mode: 'include' | 'exclude';
  userIds: string[];
}

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 150px;
` as typeof Autocomplete;

function filterMembers(members: Member[], filter: IMembersFilter): Member[] {
  if (filter.mode === 'exclude') {
    return members.filter((member) => {
      const shouldInclude = filter.userIds.indexOf(member.id) === -1 && member.isBot !== true;
      return shouldInclude;
    });
  } else {
    return members.filter((member) => {
      const shouldInclude = filter.userIds.indexOf(member.id) > -1 && member.isBot !== true;
      return shouldInclude;
    });
  }
}

interface Props extends Omit<AutocompleteProps<Member, boolean, boolean, boolean>, 'options' | 'renderInput'> {
  filter?: IMembersFilter;
  options: Member[];
  disableCloseOnSelect?: boolean;
  openOnFocus?: boolean;
  allowEmail?: boolean;
  inputVariant?: 'standard' | 'outlined' | 'filled';
  helperText?: ReactNode;
  error?: boolean;
  popupField?: boolean;
  placeholder?: string;
}

function InputSearchMemberBase({
  filter,
  options,
  placeholder,
  openOnFocus = false,
  inputVariant,
  allowEmail,
  helperText,
  error,
  popupField,
  ...props
}: Props) {
  const inputRef = createRef<HTMLInputElement>();

  const filteredOptions = filter ? filterMembers(options, filter) : options;
  // console.log('filteredOptions', filteredOptions);
  return (
    <StyledAutocomplete
      PopperComponent={popupField ? renderDiv : undefined}
      PaperComponent={popupField ? renderDiv : undefined}
      disabled={options.length === 0 && !allowEmail}
      loading={options.length === 0}
      options={filteredOptions}
      autoHighlight
      // freeSolo={props.allowEmail}
      getOptionDisabled={(option) => option.id.startsWith('email') && !isValidEmail(option.username)}
      onInputChange={(_event, value) => {
        if (allowEmail) {
          const emailOption = filteredOptions.find((opt) => opt.id.startsWith('email'));

          if (emailOption && !value) {
            filteredOptions.pop();
          } else if (emailOption && value) {
            emailOption.username = value;
          } else if (!emailOption && value) {
            filteredOptions.push({
              id: `email-${v4()}`,
              username: inputRef.current?.value,
              isBot: false,
              avatar: '/images/Google_G-grayscale.png'
            } as any);
          }
        }
      }}
      // PopperComponent={DropdownPopper}
      // user can also be a string if freeSolo=true
      getOptionLabel={(user) => (user as Member)?.username}
      renderOption={(_props, user) => (
        <UserDisplay
          {...(_props as any)}
          data-test={`user-option-${user.id}`}
          userId={user.id}
          avatarSize='small'
          avatarIcon={user.id.startsWith('email') ? <EmailIcon fontSize='large' /> : undefined}
        />
      )}
      noOptionsText='No options available'
      openOnFocus={openOnFocus}
      renderInput={(params) => (
        // @ts-ignore - MUI types are wrong
        <TextField
          {...params}
          helperText={helperText}
          error={error}
          placeholder={placeholder ?? ''}
          size='small'
          autoFocus={openOnFocus}
          InputProps={{
            ...params.InputProps,
            disableUnderline: true
          }}
          inputRef={inputRef}
          variant={inputVariant}
        />
      )}
      {...props}
      onClose={(e, reason) => {
        if (props.onClose) {
          // HACK to defer close so the change event can fire
          setTimeout(() => {
            props.onClose!(e, reason);
          }, 200);
        }
      }}
    />
  );
}

interface IInputSearchMemberMultipleProps
  extends Partial<Omit<AutocompleteProps<Member, boolean, boolean, boolean>, 'onChange'>> {
  onChange: (id: string[], reason: AutocompleteChangeReason) => void;
  defaultValue?: string[];
  filter?: IMembersFilter;
  disableCloseOnSelect?: boolean;
  allowEmail?: boolean;
  inputVariant?: 'standard' | 'outlined' | 'filled';
  helperText?: ReactNode;
  error?: boolean;
  popupField?: boolean;
  placeholder?: string;
}

export function InputSearchMemberMultiple({
  onChange,
  disableCloseOnSelect,
  defaultValue,
  multiple = true,
  ...props
}: IInputSearchMemberMultipleProps) {
  const { members, isLoading, membersRecord } = useMembers();
  const [value, setValue] = useState<Member[]>([]);

  function emitValue(users: Member[], reason: AutocompleteChangeReason) {
    setValue(users);
    onChange(
      users.map((user) => (user.id.startsWith('email') ? user.username : user.id)),
      reason
    );
  }

  useEffect(() => {
    if (!isLoading) {
      const defaultMembers = (defaultValue ?? []).map((userId) => membersRecord[userId]).filter(Boolean);
      if (defaultMembers.length > 0) {
        setValue(defaultMembers);
      }
    }
    // only run once members are loaded
  }, [isLoading]);

  return (
    <InputSearchMemberBase
      filterSelectedOptions
      multiple={multiple}
      value={value}
      disableCloseOnSelect={disableCloseOnSelect}
      onChange={(e, _value, reason) => emitValue(_value as Member[], reason)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      {...props}
      placeholder={defaultValue?.length || value.length ? undefined : (props.placeholder ?? 'Select members')}
      options={members.filter((member) => !member.isBot)}
    />
  );
}
