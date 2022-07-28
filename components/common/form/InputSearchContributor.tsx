import { Autocomplete, AutocompleteProps, Box, BoxProps, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor, User } from 'models';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes, useState, useEffect, ElementType } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';

interface IContributorsFilter {
  mode: 'include' | 'exclude',
  userIds: string []
}

function filterContributors (contributors: Contributor [], filter: IContributorsFilter): Contributor[] {
  if (filter.mode === 'exclude') {
    return contributors.filter((contributor) => {
      const shouldInclude = filter.userIds.indexOf(contributor.id) === -1 && contributor.isBot !== true;
      return shouldInclude;
    });
  }
  else {
    return contributors.filter((contributor) => {
      const shouldInclude = filter.userIds.indexOf(contributor.id) > -1 && contributor.isBot !== true;
      return shouldInclude;
    });
  }
}

type BooleanField = boolean | undefined;

interface Props extends Omit<AutocompleteProps<Contributor, BooleanField, BooleanField, BooleanField>, 'options' | 'renderInput'> {
  filter?: IContributorsFilter;
  options: Contributor[];
  disableCloseOnSelect?: boolean
}

function InputSearchContributorBase ({ filter, options, disableCloseOnSelect, placeholder, ...props }: Props) {

  const { chainId } = useWeb3React<Web3Provider>();

  const { cache } = useSWRConfig();

  const filteredOptions = filter ? filterContributors(options, filter) : options;

  return (
    <Autocomplete
      disabled={options.length === 0}
      disableCloseOnSelect={disableCloseOnSelect}
      loading={options.length === 0}
      sx={{ minWidth: 150 }}
      placeholder={filteredOptions.length > 0 ? placeholder : ''}
      // @ts-ignore - not sure why this fails
      options={filteredOptions}
      autoHighlight
      // user can also be a string if freeSolo=true
      getOptionLabel={(user) => cache.get(`@"ENS",102~,"${(user as Contributor).username}",${chainId},`) ?? (user as Contributor).username}
      renderOption={(_props, user) => (
        <ReviewerOption
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

interface IInputSearchContributorProps {
  onChange: (id: string) => void
  defaultValue?: string,
  filter?: IContributorsFilter
}

export function InputSearchContributor ({ defaultValue, onChange, ...props }: IInputSearchContributorProps) {

  const [contributors] = useContributors();
  const [value, setValue] = useState<Contributor | null>(null);

  useEffect(() => {
    if (defaultValue && !value) {
      const contributor = contributors.find(c => c.id === defaultValue);
      if (contributor) {
        setValue(contributor);
      }
    }
  }, [defaultValue, contributors]);

  function emitValue (selectedUser: Contributor) {
    if (selectedUser) {
      onChange(selectedUser.id);
    }
    setValue(selectedUser);
  }

  return (
    <InputSearchContributorBase
      options={contributors}
      onChange={(e, _value) => emitValue(_value as Contributor)}
      placeholder='Select a user'
      value={value}
      {...props}
    />
  );
}

interface IInputSearchContributorMultipleProps extends Partial<Omit<AutocompleteProps<Contributor, true, true, true>, 'onChange'>> {
  onChange: (id: string[]) => void
  defaultValue?: string[]
  filter?: IContributorsFilter
  disableCloseOnSelect?: boolean
}

export function InputSearchContributorMultiple ({ onChange, disableCloseOnSelect, defaultValue, ...props }: IInputSearchContributorMultipleProps) {

  const [contributors] = useContributors();
  const [value, setValue] = useState<Contributor[]>([]);

  function emitValue (users: Contributor[]) {
    onChange(users.map(user => user.id));
    setValue(users);
  }

  useEffect(() => {
    if (defaultValue && value.length === 0) {
      const defaultContributors = contributors.filter(contributor => {
        return defaultValue.includes(contributor.id);
      });
      setValue(defaultContributors);
    }
  }, [defaultValue, contributors]);

  return (
    <InputSearchContributorBase
      filterSelectedOptions
      multiple
      placeholder='Select users'
      value={value}
      disableCloseOnSelect={disableCloseOnSelect}
      onChange={(e, _value) => emitValue(_value as Contributor[])}
      {...props}
      options={contributors}
    />
  );
}

export function ReviewerOption ({ user, avatarSize, fontSize, fontWeight, ...props }: { fontSize?: string | number, fontWeight?: number | string, user: Omit<User, 'addresses'>, avatarSize?: 'small' | 'medium' } & HTMLAttributes<HTMLLIElement> & {component?: ElementType} & BoxProps) {
  return (
    <Box display='flex' gap={1} {...props} component={props.component ?? 'li'}>
      <Avatar size={avatarSize} name={user.username as string} avatar={user.avatar} />
      <Typography fontSize={fontSize} fontWeight={fontWeight}>{user.username}</Typography>
    </Box>
  );
}
