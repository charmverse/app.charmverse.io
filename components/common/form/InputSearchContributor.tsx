import { Autocomplete, AutocompleteProps, Box, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor, User } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
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
}

function InputSearchContributorBase ({ filter, options, placeholder, ...props }: Props) {

  const { chainId } = useWeb3React<Web3Provider>();

  const { cache } = useSWRConfig();

  const filteredOptions = filter ? filterContributors(options, filter) : options;

  return (
    <Autocomplete
      {...props}
      disabled={filteredOptions.length === 0}
      loading={options.length === 0}
      sx={{ minWidth: 150 }}
      // @ts-ignore - not sure why this fails
      options={filteredOptions}
      autoHighlight
      getOptionLabel={(user) => cache.get(`@"ENS",102~,"${user.addresses[0]}",${chainId},`) ?? getDisplayName(user)}
      renderOption={(_props, user) => (
        <ReviewerOption {..._props} user={user} />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          size='small'
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
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

interface IInputSearchContributorMultipleProps {
  onChange: (id: string[]) => void
  defaultValue?: string[]
  filter?: IContributorsFilter
}

export function InputSearchContributorMultiple ({ onChange, defaultValue, ...props }: IInputSearchContributorMultipleProps) {

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
      options={contributors}
      placeholder='Select users'
      value={value}
      onChange={(e, _value) => emitValue(_value as Contributor[])}
      {...props}
    />
  );
}

export function ReviewerOption ({ user, avatarSize, ...props }: { user: User, avatarSize?: 'small' | 'medium' } & HTMLAttributes<HTMLLIElement> & {component?: ElementType}) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <Box component={props.component ?? 'li'} display='flex' gap={1} {...props}>
      <Avatar size={avatarSize} name={ensName || getDisplayName(user)} avatar={user.avatar} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
