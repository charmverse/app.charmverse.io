import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useContributors } from 'hooks/useContributors';
import { Contributor } from 'models';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import Avatar from 'components/common/Avatar';

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
      getOptionLabel={user => getDisplayName(user)}
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

function ReviewerOption ({ user, ...props }: { user: Contributor } & any) {
  const ensName = useENSName(user.addresses[0]);
  return (
    <Box component='li' display='flex' gap={1} {...props}>
      <Avatar name={ensName || getDisplayName(user)} />
      <Typography>{ensName || getDisplayName(user)}</Typography>
    </Box>
  );
}
