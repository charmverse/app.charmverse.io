import { Autocomplete, Box, BoxProps, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor, DiscordUser } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';
import { HTMLAttributes } from 'react';

export interface IInputSearchContributorProps {
  onChange?: (id: string) => any
  defaultValue?: string
}

export function InputSearchContributor ({ onChange = () => {}, defaultValue }: IInputSearchContributorProps) {

  const [contributors] = useContributors();

  const preselectedContributor = contributors.find(contributor => {
    return contributor.id === defaultValue;
  });

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
      getOptionLabel={user => user?.discord ? `${(user?.discord as any)?.username}#${(user?.discord as any)?.discriminator}` : getDisplayName(user)}
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
  const discordData = (user?.discord as unknown as DiscordUser);

  return (
    <Box component='li' display='flex' gap={1} {...props}>
      <Avatar size={avatarSize} name={ensName || getDisplayName(user)} avatar={discordData?.avatar ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png` : null} />
      <Typography>{ensName || discordData ? `${discordData.username}#${discordData.discriminator}` : getDisplayName(user)}</Typography>
    </Box>
  );
}
