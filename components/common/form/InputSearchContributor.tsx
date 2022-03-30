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

function InputSearchContributorBase ({ defaultValue, ...props }:
  Partial<ComponentProps<typeof Autocomplete>>) {
  const [contributors] = useContributors();
  const { chainId } = useWeb3React<Web3Provider>();
  const defaultContributor = typeof defaultValue === 'string' ? contributors.find(contributor => {
    return contributor.id === defaultValue;
  }) : undefined;

  const { cache } = useSWRConfig();

  return contributors.length !== 0 ? (
    <Autocomplete<Contributor>
      defaultValue={defaultContributor}
      loading={contributors.length === 0}
      sx={{ minWidth: 150 }}
      // @ts-ignore - not sure why this fails
      options={contributors}
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
  ) : null;
}

interface IInputSearchContributorProps {
  onChange: (id: string) => void
  defaultValue?: string
}

export function InputSearchContributor (props: IInputSearchContributorProps) {
  function emitValue (selectedUser: Contributor) {
    if (selectedUser) {
      props.onChange(selectedUser.id);
    }
  }

  return <InputSearchContributorBase {...props} onChange={(e, value) => emitValue(value as Contributor)} />;
}

interface IInputSearchContributorMultipleProps {
  onChange: (id: string[]) => void
  defaultValue?: string[]
}

export function InputSearchContributorMultiple ({ onChange, ...props }: IInputSearchContributorMultipleProps) {
  function emitValue (users: Contributor[]) {
    console.log('change!', users);
    onChange(users.map(user => user.id));
  }
  return <InputSearchContributorBase {...props} onChange={(e, value) => emitValue(value as Contributor[])} multiple />;
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
