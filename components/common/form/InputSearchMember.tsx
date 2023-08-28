import styled from '@emotion/styled';
import EmailIcon from '@mui/icons-material/Email';
import type { AutocompleteChangeReason, AutocompleteProps, PopperProps } from '@mui/material';
import { Autocomplete, Popover, TextField } from '@mui/material';
import { createRef, useEffect, useState } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';
import { isValidEmail } from 'lib/utilities/strings';

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
}

export function InputSearchMemberBase({
  filter,
  options,
  placeholder,
  openOnFocus = false,
  inputVariant,
  allowEmail,
  ...props
}: Props) {
  const inputRef = createRef<HTMLInputElement>();

  const filteredOptions = filter ? filterMembers(options, filter) : options;
  return (
    <StyledAutocomplete
      disabled={options.length === 0 && !allowEmail}
      loading={options.length === 0}
      options={filteredOptions}
      autoHighlight
      // freeSolo={props.allowEmail}
      getOptionDisabled={(option) => option.id === 'email' && !isValidEmail(option.username)}
      onInputChange={(_event, value) => {
        if (allowEmail) {
          const emailOption = filteredOptions.find((opt) => opt.id === 'email');

          if (emailOption && !value) {
            filteredOptions.pop();
          } else if (emailOption && value) {
            emailOption.username = value;
          } else if (!emailOption && value) {
            filteredOptions.push({
              id: 'email',
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
          user={user}
          avatarSize='small'
          avatarIcon={user.id === 'email' ? <EmailIcon fontSize='large' /> : undefined}
        />
      )}
      noOptionsText='No options available'
      openOnFocus={openOnFocus}
      renderInput={(params) => (
        // @ts-ignore - MUI types are wrong
        <TextField
          {...params}
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
    />
  );
}

interface IInputSearchMemberProps {
  onChange: (id: string) => void;
  defaultValue?: string;
  filter?: IMembersFilter;
  onClear?: VoidFunction;
  openOnFocus?: boolean;
}

export function InputSearchMember({ defaultValue, onChange, onClear, openOnFocus, ...props }: IInputSearchMemberProps) {
  const { getMemberById, members } = useMembers();
  const [value, setValue] = useState<Member | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      const member = getMemberById(defaultValue);
      if (member) {
        setValue(member);
      }
    }
  }, [defaultValue, getMemberById]);

  function emitValue(selectedUser: Member) {
    if (selectedUser) {
      onChange(selectedUser.id === 'email' ? selectedUser.username : selectedUser.id);
    }
    if (onClear && !selectedUser) {
      onClear();
    }
    setValue(selectedUser);
  }

  return (
    <InputSearchMemberBase
      options={members}
      onChange={(e, _value) => emitValue(_value as Member)}
      placeholder='Select a user'
      value={value}
      openOnFocus={openOnFocus}
      {...props}
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
}

export function InputSearchMemberMultiple({
  onChange,
  disableCloseOnSelect,
  defaultValue,
  ...props
}: IInputSearchMemberMultipleProps) {
  const { members, membersRecord } = useMembers();
  const defaultMembers = (defaultValue || []).map((userId) => membersRecord[userId]).filter(Boolean);
  const [value, setValue] = useState<Member[]>(defaultMembers);

  function emitValue(users: Member[], reason: AutocompleteChangeReason) {
    onChange(
      users.map((user) => (user.id === 'email' ? user.username : user.id)),
      reason
    );
    setValue(users);
  }

  useEffect(() => {
    if (defaultValue && value.length === 0) {
      const _defaultMembers = defaultValue.map((userId) => membersRecord[userId]).filter(Boolean);
      if (_defaultMembers.length > 0) {
        setValue(_defaultMembers);
      }
    }
  }, [defaultValue, membersRecord]);

  return (
    <InputSearchMemberBase
      filterSelectedOptions
      multiple
      placeholder='Select users'
      value={value}
      disableCloseOnSelect={disableCloseOnSelect}
      onChange={(e, _value, reason) => emitValue(_value as Member[], reason)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      {...props}
      options={members}
    />
  );
}
