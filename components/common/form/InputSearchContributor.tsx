import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes, useEffect, useMemo, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useSWRConfig } from 'swr';

/**
 * @filter Use this to exclude certain users or only include certain users in this field's inputs
 */
export interface IInputSearchContributorProps {
  onChange?: (id: string) => any
  defaultValue?: string,
  filter?: {
    mode: 'include' | 'exclude',
    userIds: string []
  }
}

export function InputSearchContributor ({ onChange = () => {}, defaultValue, filter }: IInputSearchContributorProps) {
  const [contributors] = useContributors();
  const { chainId } = useWeb3React<Web3Provider>();

  const [filteredContributors, setFilteredContributors] = useState<Contributor[]>([]);

  useEffect(() => {

    if (filter?.mode === 'include') {
      const filtered = contributors.filter(contributor => {
        const userShouldBeIncluded = filter.userIds.indexOf(contributor.id) > -1;
        return userShouldBeIncluded;
      });
      setFilteredContributors(filtered);
    }
    else if (filter?.mode === 'exclude') {
      const filtered = contributors.filter(contributor => {
        return filter.userIds.indexOf(contributor.id) === -1;
      });
      setFilteredContributors(filtered);
    }
    else {
      setFilteredContributors(contributors ?? []);
    }
  }, [contributors, filter]);

  const preselectedContributor = filteredContributors.find(contributor => {
    return contributor.id === defaultValue;
  });

  const { cache } = useSWRConfig();

  function emitValue (selectedUser: Contributor) {
    if (selectedUser === null) {
      return;
    }

    const matchingContributor = filteredContributors.find(contributor => {
      return contributor.id === selectedUser.id;
    });

    if (matchingContributor) {
      onChange(matchingContributor.id);
    }
  }

  if (filteredContributors.length === 0) {
    return null;
  }

  console.log('Available contributors', filteredContributors);

  return (
    <Autocomplete
      defaultValue={preselectedContributor}
      onChange={(_, value) => {
        emitValue(value as any);
      }}
      sx={{ minWidth: 150 }}
      options={filteredContributors}
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
      <Avatar size={avatarSize} name={ensName || getDisplayName(user)} avatar={user.avatar} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
