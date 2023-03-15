import type { AutocompleteChangeReason, AutocompleteProps, PopperProps } from '@mui/material';
import { Autocomplete, Popper, TextField } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

interface IMembersFilter {
  mode: 'include' | 'exclude';
  userIds: string[];
}

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
}

export function InputSearchMemberBase({
  filter,
  options,
  disableCloseOnSelect,
  placeholder,
  openOnFocus = false,
  ...props
}: Props) {
  const filteredOptions = filter ? filterMembers(options, filter) : options;
  const PopperComponent = useCallback((popperProps: PopperProps) => {
    return <Popper {...popperProps} sx={{ ...popperProps.sx, minWidth: 300 }} />;
  }, []);

  return (
    <Autocomplete
      disabled={options.length === 0}
      disableCloseOnSelect={disableCloseOnSelect}
      loading={options.length === 0}
      sx={{ minWidth: 150 }}
      placeholder={filteredOptions.length > 0 ? placeholder : ''}
      options={filteredOptions}
      autoHighlight
      // user can also be a string if freeSolo=true
      getOptionLabel={(user) => (user as Member)?.username}
      renderOption={(_props, user) => <UserDisplay {...(_props as any)} user={user} />}
      noOptionsText='No options available'
      PopperComponent={PopperComponent}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={filteredOptions.length > 0 ? placeholder : ''}
          size='small'
          autoFocus={openOnFocus}
          inputProps={{
            ...params.inputProps
          }}
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
  const { members } = useMembers();
  const [value, setValue] = useState<Member | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      const member = members.find((c) => c.id === defaultValue);
      if (member) {
        setValue(member);
      }
    }
  }, [defaultValue, members]);

  function emitValue(selectedUser: Member) {
    if (selectedUser) {
      onChange(selectedUser.id);
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
}

export function InputSearchMemberMultiple({
  onChange,
  disableCloseOnSelect,
  defaultValue,
  ...props
}: IInputSearchMemberMultipleProps) {
  const { members } = useMembers();
  const [value, setValue] = useState<Member[]>([]);

  function emitValue(users: Member[], reason: AutocompleteChangeReason) {
    onChange(
      users.map((user) => user.id),
      reason
    );
    setValue(users);
  }

  useEffect(() => {
    if (defaultValue && value.length === 0) {
      const defaultMembers = members.filter((member) => {
        return defaultValue.includes(member.id);
      });
      setValue(defaultMembers);
    }
  }, [defaultValue, members]);

  return (
    <InputSearchMemberBase
      filterSelectedOptions
      multiple
      placeholder='Select users'
      value={value}
      disableCloseOnSelect={disableCloseOnSelect}
      onChange={(e, _value, reason) => emitValue(_value as Member[], reason)}
      {...props}
      options={members}
    />
  );
}
