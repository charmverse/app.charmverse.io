import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';

export interface IInputSearchContributorProps {
  onChange?: (id: string) => any
  defaultValue?: string
}

export function InputSearchContributor ({ onChange = () => {}, defaultValue }: IInputSearchContributorProps) {
  const [contributors] = useContributors();
  const { chainId } = useWeb3React<Web3Provider>();
  const preselectedContributor = contributors.find(contributor => {
    return contributor.id === defaultValue;
  });

  const { cache } = useSWRConfig();

  function emitValue (selectedUser: Contributor) {
    if (selectedUser === null) {
      return;
    }

    const matchingContributor = contributors.find(contributor => {
      return contributor.id === selectedUser.id;
    });

    if (matchingContributor) {
      onChange(matchingContributor.id);
    }
  }

  if (contributors.length === 0) {
    return null;
  }

  return (
    <Autocomplete
      defaultValue={preselectedContributor}
      onChange={(_, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={contributors}
      autoHighlight
      getOptionLabel={(user) => cache.get(`@"ENS",102~,"${user.addresses[0]}",${chainId},`) ?? getDisplayName(user)}
      renderOption={(props, user) => (
        <ReviewerOption {...props} user={user} />
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputProps={{
            ...params.inputProps
          }}
        />
      )}
    />
  );
}

export function ReviewerOption ({ user, avatarSize, ...props }: { user: Contributor, avatarSize?: 'small' | 'medium' } & HTMLAttributes<HTMLLIElement>) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <Box component='li' display='flex' gap={1} {...props}>
      <Avatar size={avatarSize} name={getDisplayName(user)} avatar={user.avatar} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
