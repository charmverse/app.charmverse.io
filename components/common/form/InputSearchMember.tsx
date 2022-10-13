import type { AutocompleteProps } from '@mui/material';
import { Autocomplete, TextField } from '@mui/material';
import { useEffect, useState } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

interface IMembersFilter {
  mode: 'include' | 'exclude';
  userIds: string [];
}

function filterMembers (members: Member [], filter: IMembersFilter): Member[] {
  if (filter.mode === 'exclude') {
    return members.filter((member) => {
      const shouldInclude = filter.userIds.indexOf(member.id) === -1 && member.isBot !== true;
      return shouldInclude;
    });
  }
  else {
    return members.filter((member) => {
      const shouldInclude = filter.userIds.indexOf(member.id) > -1 && member.isBot !== true;
      return shouldInclude;
    });
  }
}

type BooleanField = boolean | undefined;

interface Props extends Omit<AutocompleteProps<Member, BooleanField, BooleanField, BooleanField>, 'options' | 'renderInput'> {
  filter?: IMembersFilter;
  options: Member[];
  disableCloseOnSelect?: boolean;
}

export function InputSearchMemberBase ({ filter, options, disableCloseOnSelect, placeholder, ...props }: Props) {
  const filteredOptions = filter ? filterMembers(options, filter) : options;

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
      getOptionLabel={(user) => (user as Member).username}
      renderOption={(_props, user) => (
        <UserDisplay
          {..._props as any}
          user={user}
        />
      )}
      noOptionsText='No options available'
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={filteredOptions.length > 0 ? placeholder : ''}
          size='small'
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
}

export function InputSearchMember ({ defaultValue, onChange, ...props }: IInputSearchMemberProps) {

  const { members } = useMembers();
  const [value, setValue] = useState<Member | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      const member = members.find(c => c.id === defaultValue);
      if (member) {
        setValue(member);
      }
    }
  }, [defaultValue, members]);

  function emitValue (selectedUser: Member) {
    if (selectedUser) {
      onChange(selectedUser.id);
    }
    setValue(selectedUser);
  }

  return (
    <InputSearchMemberBase
      options={members}
      onChange={(e, _value) => emitValue(_value as Member)}
      placeholder='Select a user'
      value={value}
      {...props}
    />
  );
}

interface IInputSearchMemberMultipleProps extends Partial<Omit<AutocompleteProps<Member, true, true, true>, 'onChange'>> {
  onChange: (id: string[]) => void;
  defaultValue?: string[];
  filter?: IMembersFilter;
  disableCloseOnSelect?: boolean;
}

export function InputSearchMemberMultiple ({ onChange, disableCloseOnSelect, defaultValue, ...props }: IInputSearchMemberMultipleProps) {

  const { members } = useMembers();
  const [value, setValue] = useState<Member[]>([]);

  function emitValue (users: Member[]) {
    onChange(users.map(user => user.id));
    setValue(users);
  }

  useEffect(() => {
    if (defaultValue && value.length === 0) {
      const defaultMembers = members.filter(member => {
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
      onChange={(e, _value) => emitValue(_value as Member[])}
      {...props}
      options={members}
    />
  );
}
