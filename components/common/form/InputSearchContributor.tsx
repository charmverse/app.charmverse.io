import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes, ComponentProps } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';

interface IContributorsFilter {
  mode: 'include' | 'exclude',
  userIds: string []
}

function filterContributors (contributors: Contributor [], filter: IContributorsFilter): Contributor [] {
  if (filter.mode === 'exclude') {
    return contributors.filter(contributor => {
      const shouldInclude = filter.userIds.indexOf(contributor.id) === -1;
      return shouldInclude;
    });
  }
  else {
    return contributors.filter(contributor => {
      const shouldInclude = filter.userIds.indexOf(contributor.id) > -1;
      return shouldInclude;
    });
  }
}

function InputSearchContributorBase ({
  defaultValue, disableCloseOnSelect = false, filter, ...props
}: Partial<ComponentProps<typeof Autocomplete>> & {filter?: IContributorsFilter}) {
  const [contributors] = useContributors();
  const { chainId } = useWeb3React<Web3Provider>();
  const defaultContributor = typeof defaultValue === 'string' ? contributors.find(contributor => {
    return contributor.id === defaultValue;
  }) : undefined;

  const { cache } = useSWRConfig();

  const filteredContributors = filter ? filterContributors(contributors, filter) : contributors;

  return (
    <Autocomplete<Contributor>
      defaultValue={defaultContributor}
      loading={contributors.length === 0}
      sx={{ minWidth: 150 }}
      disableCloseOnSelect={disableCloseOnSelect}
      // @ts-ignore - not sure why this fails
      options={filteredContributors}
      autoHighlight
      getOptionLabel={(user) => cache.get(`@"ENS",102~,"${user.addresses[0]}",${chainId},`) ?? getDisplayName(user)}
      renderOption={(_props, user) => (
        <ReviewerOption {..._props} user={user} />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
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

export function InputSearchContributor (props: IInputSearchContributorProps) {
  function emitValue (selectedUser: Contributor) {
    if (selectedUser) {
      props.onChange(selectedUser.id);
    }
  }

  return <InputSearchContributorBase {...props} onChange={(e, value) => emitValue(value as Contributor)} multiple />;
}

interface IInputSearchContributorMultipleProps {
  onChange: (id: string[]) => void
  defaultValue?: string[]
  filter?: IContributorsFilter
}

export function InputSearchContributorMultiple ({ onChange, filter, ...props }: IInputSearchContributorMultipleProps) {
  function emitValue (users: Contributor[]) {
    console.log('change!', users);
    onChange(users.map(user => user.id));
  }

  console.log('Filter', filter);
  return (
    <InputSearchContributorBase
      {...props}
      onChange={(e, value) => emitValue(value as Contributor[])}
      multiple
      disableCloseOnSelect={true}
      filter={filter}
    />
  );
}

export function ReviewerOption ({ user, avatarSize, ...props }: { user: Contributor, avatarSize?: 'small' | 'medium' } & HTMLAttributes<HTMLLIElement>) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <Box component='li' display='flex' gap={1} {...props}>
      <Avatar size={avatarSize} name={ensName || getDisplayName(user)} avatar={user.avatar} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
